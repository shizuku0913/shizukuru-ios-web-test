import SwiftUI

@main
struct ShizukuruMixingLabApp: App {
    var body: some Scene {
        WindowGroup { ShizukuruWebView().ignoresSafeArea() }
    }
}
