import SwiftUI
import WebKit
import UIKit
import Photos

struct ShizukuruWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let content = WKUserContentController()
        content.add(context.coordinator, name: "shizukuru")
        let bootstrap = """
        (function(){
          window.ShizukuruIOSHost = true;
          window.ShizukuruIOSLock = {
            setLocked: function(locked){
              try { window.webkit.messageHandlers.shizukuru.postMessage({type:'lock',locked:!!locked}); } catch (_) {}
            }
          };
          window.ShizukuruIOSFiles = {
            savePng: function(dataUrl,filename){
              try { window.webkit.messageHandlers.shizukuru.postMessage({type:'savePng',dataUrl:String(dataUrl||''),filename:String(filename||'shizukuru.png')}); } catch (_) {}
            },
            sharePng: function(dataUrl,filename){
              try { window.webkit.messageHandlers.shizukuru.postMessage({type:'sharePng',dataUrl:String(dataUrl||''),filename:String(filename||'shizukuru.png')}); } catch (_) {}
            }
          };
          window.ShizukuruExternalLink = {
            openUrl: function(url){
              try { window.webkit.messageHandlers.shizukuru.postMessage({type:'openUrl',url:String(url||'')}); } catch (_) {}
            }
          };
        })();
        """
        content.addUserScript(WKUserScript(source: bootstrap, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController = content

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        context.coordinator.webView = webView

        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") else {
            assertionFailure("Bundled www/index.html was not found")
            return webView
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "shizukuru")
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        weak var webView: WKWebView?
        private var childLockEnabled = false

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "shizukuru", let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
            switch type {
            case "lock":
                setChildLock(body["locked"] as? Bool ?? false)
            case "savePng":
                guard let dataUrl = body["dataUrl"] as? String else { return }
                savePNG(dataUrl: dataUrl)
            case "sharePng":
                guard let dataUrl = body["dataUrl"] as? String else { return }
                sharePNG(dataUrl: dataUrl, filename: body["filename"] as? String ?? "shizukuru.png")
            case "openUrl":
                guard let raw = body["url"] as? String, let url = URL(string: raw), url.scheme == "https" else { return }
                let host = url.host ?? ""
                guard host == "nullnode.studio" || host.hasSuffix(".nullnode.studio") else { return }
                UIApplication.shared.open(url)
            default: break
            }
        }

        private func setChildLock(_ locked: Bool) {
            // iOS has no consumer-app equivalent of Android Lock Task that can
            // suppress the Home gesture. Preserve Shizukuru's lock state and
            // native→Web confirmation; use Guided Access for OS-level confinement.
            childLockEnabled = locked
            let js = "window.ShizukuruDrawLock && window.ShizukuruDrawLock.syncNativeState(\(locked ? "true" : "false"));"
            DispatchQueue.main.async { [weak self] in self?.webView?.evaluateJavaScript(js) }
        }

        private func pngData(from dataUrl: String) -> Data? {
            guard let comma = dataUrl.firstIndex(of: ",") else { return nil }
            return Data(base64Encoded: String(dataUrl[dataUrl.index(after: comma)...]))
        }

        private func notifyExport(_ operation: String, ok: Bool, message: String) {
            let escaped = message.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'")
            let js = "window.__shizukuruNativeExportResult && window.__shizukuruNativeExportResult('\(operation)',\(ok ? "true" : "false"),'\(escaped)');"
            DispatchQueue.main.async { [weak self] in self?.webView?.evaluateJavaScript(js) }
        }

        private func savePNG(dataUrl: String) {
            guard let data = pngData(from: dataUrl) else { notifyExport("save", ok: false, message: "画像の作成に失敗しました"); return }
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { [weak self] status in
                guard status == .authorized || status == .limited else { self?.notifyExport("save", ok: false, message: "写真への保存が許可されていません"); return }
                PHPhotoLibrary.shared().performChanges({
                    let request = PHAssetCreationRequest.forAsset()
                    request.addResource(with: .photo, data: data, options: nil)
                }) { success, error in
                    self?.notifyExport("save", ok: success, message: success ? "写真に保存しました" : (error?.localizedDescription ?? "保存に失敗しました"))
                }
            }
        }

        private func sharePNG(dataUrl: String, filename: String) {
            guard let data = pngData(from: dataUrl) else { notifyExport("share", ok: false, message: "画像の作成に失敗しました"); return }
            let safe = filename.replacingOccurrences(of: "/", with: "-")
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(safe.isEmpty ? "shizukuru.png" : safe)
            do { try data.write(to: url, options: .atomic) } catch { notifyExport("share", ok: false, message: "共有用画像を準備できませんでした"); return }
            DispatchQueue.main.async { [weak self] in
                guard let self,
                      let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first,
                      let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController else { return }
                var presenter = root
                while let presented = presenter.presentedViewController { presenter = presented }
                let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
                sheet.completionWithItemsHandler = { _, completed, _, error in
                    self.notifyExport("share", ok: error == nil, message: error?.localizedDescription ?? (completed ? "共有しました" : "共有を閉じました"))
                }
                if let pop = sheet.popoverPresentationController {
                    pop.sourceView = presenter.view
                    pop.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
                }
                presenter.present(sheet, animated: true)
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
            let scheme = url.scheme?.lowercased()
            decisionHandler((scheme == "file" || scheme == "about" || scheme == nil) ? .allow : .cancel)
        }
    }
}
