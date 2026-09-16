package jp.shizukuru.mixinglab;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.Purchase;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String NATIVE_DRAWING_RECOVERY_FILE = "drawing-recovery-v1.png";
    private static final String SUPPORT_PRODUCT_ID = "shizukuru_support_300";


    private WebView webView;
    private NativeDrawingView nativeDrawingView;
    private ImageView splashView;
    private boolean drawingActive = false;
    private boolean splashDismissed = false;
    private boolean navigationLocked = false;
    private boolean pendingNavigationLock = false;
    private long pendingNavigationLockStartedAt = 0L;
    private boolean externalShareActive = false;
    private final ExecutorService fileExecutor = Executors.newSingleThreadExecutor();
    private BillingClient billingClient;
    private ProductDetails supportProductDetails;
    private volatile boolean supportPurchased = false;
    private volatile boolean billingConnecting = false;
    private Runnable pendingBillingReadyAction;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configureWindowForFullscreenContent();

        FrameLayout root = new FrameLayout(this);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFFFFFAF2);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // Clean rebase: only the drawing surface is native. It sits above WebView,
        // never consumes touch, and is clipped to the real DOM paper rectangle.
        nativeDrawingView = new NativeDrawingView();
        root.addView(nativeDrawingView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        splashView = new ImageView(this);
        splashView.setImageResource(R.drawable.splash_shizukuru);
        splashView.setScaleType(ImageView.ScaleType.CENTER_CROP);
        splashView.setBackgroundColor(Color.WHITE);
        splashView.setContentDescription(null);
        splashView.setClickable(true);
        root.addView(splashView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Wait for the local page's load event, then let Android remove the
                // native splash. This adds no artificial splash delay.
                view.evaluateJavascript(
                        "(function(){var r=function(){if(window.ShizukuruSplash){setTimeout(function(){ShizukuruSplash.ready();},80);}};" +
                        "if(document.readyState==='complete'){r();}else{window.addEventListener('load',r,{once:true});}})();",
                        null);
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidLockBridge(), "ShizukuruAndroidLock");
        webView.addJavascriptInterface(new AndroidFilesBridge(), "ShizukuruAndroidFiles");
        webView.addJavascriptInterface(new AndroidDrawingBridge(), "ShizukuruAndroidDrawing");
        webView.addJavascriptInterface(new SplashBridge(), "ShizukuruSplash");
        webView.addJavascriptInterface(new SupportPurchaseBridge(), "ShizukuruSupportPurchase");
        webView.addJavascriptInterface(new ExternalLinkBridge(), "ShizukuruExternalLink");

        initializeBilling();

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }

        webView.post(this::applyUnlockedSystemUi);
    }

    private void initializeBilling() {
        billingClient = BillingClient.newBuilder(this)
                .setListener((billingResult, purchases) -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                            && purchases != null) {
                        handlePurchases(purchases);
                    } else if (billingResult.getResponseCode()
                            != BillingClient.BillingResponseCode.USER_CANCELED) {
                        notifySupportPurchaseMessage("購入を開始できませんでした。時間をおいてもう一度お試しください。");
                    }
                })
                .enablePendingPurchases()
                .build();
        connectBillingIfNeeded(null);
    }

    private void connectBillingIfNeeded(Runnable whenReady) {
        if (billingClient == null) {
            if (whenReady != null) notifySupportPurchaseMessage("Google Play の購入機能を準備できませんでした。");
            return;
        }
        if (billingClient.isReady()) {
            if (whenReady != null) whenReady.run();
            return;
        }
        if (billingConnecting) {
            if (whenReady != null) pendingBillingReadyAction = whenReady;
            return;
        }
        billingConnecting = true;
        if (whenReady != null) pendingBillingReadyAction = whenReady;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                billingConnecting = false;
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    querySupportProductDetails();
                    queryExistingSupportPurchase();
                    Runnable action = pendingBillingReadyAction;
                    pendingBillingReadyAction = null;
                    if (action != null) action.run();
                } else {
                    pendingBillingReadyAction = null;
                    if (whenReady != null) {
                        notifySupportPurchaseMessage("Google Play の購入機能に接続できませんでした。");
                    }
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                billingConnecting = false;
            }
        });
    }

    private void querySupportProductDetails() {
        if (billingClient == null || !billingClient.isReady()) return;
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(SUPPORT_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();
        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                    && productDetailsList != null && !productDetailsList.isEmpty()) {
                supportProductDetails = productDetailsList.get(0);
            }
        });
    }

    private void queryExistingSupportPurchase() {
        if (billingClient == null || !billingClient.isReady()) return;
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                supportPurchased = false;
                handlePurchases(purchases == null ? Collections.emptyList() : purchases);
                notifySupportPurchaseChanged();
            }
        });
    }

    private void handlePurchases(List<Purchase> purchases) {
        for (Purchase purchase : purchases) {
            if (!purchase.getProducts().contains(SUPPORT_PRODUCT_ID)) continue;
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                supportPurchased = true;
                if (!purchase.isAcknowledged()) {
                    AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchase.getPurchaseToken())
                            .build();
                    billingClient.acknowledgePurchase(params, result -> {
                        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            notifySupportPurchaseChanged();
                        }
                    });
                } else {
                    notifySupportPurchaseChanged();
                }
            }
        }
    }

    private void launchSupportPurchase() {
        if (supportPurchased) {
            notifySupportPurchaseChanged();
            return;
        }
        connectBillingIfNeeded(() -> {
            if (supportProductDetails == null) {
                querySupportProductDetailsAndLaunch();
                return;
            }
            launchSupportPurchaseWithDetails();
        });
    }

    private void querySupportProductDetailsAndLaunch() {
        if (billingClient == null || !billingClient.isReady()) return;
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(SUPPORT_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();
        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                    && productDetailsList != null && !productDetailsList.isEmpty()) {
                supportProductDetails = productDetailsList.get(0);
                runOnUiThread(this::launchSupportPurchaseWithDetails);
            } else {
                notifySupportPurchaseMessage("応援購入の商品情報を取得できませんでした。Play Console の商品設定をご確認ください。");
            }
        });
    }

    private void launchSupportPurchaseWithDetails() {
        if (supportProductDetails == null || billingClient == null || !billingClient.isReady()) return;
        BillingFlowParams.ProductDetailsParams productParams =
                BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(supportProductDetails)
                        .build();
        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(productParams))
                .build();
        BillingResult result = billingClient.launchBillingFlow(this, flowParams);
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            notifySupportPurchaseMessage("購入画面を開けませんでした。Google Play からインストールしたテスト版でお試しください。");
        }
    }

    private void notifySupportPurchaseChanged() {
        if (webView == null) return;
        webView.post(() -> webView.evaluateJavascript(
                "document.dispatchEvent(new CustomEvent('shizukuru-support-purchase-changed'));", null));
    }

    private void notifySupportPurchaseMessage(String message) {
        if (webView == null) return;
        final String quoted = JSONObject.quote(message == null ? "" : message);
        webView.post(() -> webView.evaluateJavascript(
                "(function(){var n=document.getElementById('parentSupportNote');if(n)n.textContent=" + quoted + ";})();",
                null));
    }

    private final class SupportPurchaseBridge {
        @JavascriptInterface
        public void start() {
            runOnUiThread(MainActivity.this::launchSupportPurchase);
        }

        @JavascriptInterface
        public boolean isPurchased() {
            return supportPurchased;
        }

        @JavascriptInterface
        public void restore() {
            runOnUiThread(() -> connectBillingIfNeeded(MainActivity.this::queryExistingSupportPurchase));
        }
    }

    private void configureWindowForFullscreenContent() {
        Window window = getWindow();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        } else {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attrs = window.getAttributes();
            attrs.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attrs);
        }

        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
    }

    private void applyUnlockedSystemUi() {
        Window window = getWindow();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.show(WindowInsets.Type.statusBars()
                        | WindowInsets.Type.navigationBars());
                controller.setSystemBarsAppearance(
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            }
        } else {
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }
    }

    private void applyImmersiveMode() {
        Window window = getWindow();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars()
                        | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }


    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        if (drawingActive && nativeDrawingView != null
                && (event.getSource() & InputDevice.SOURCE_TOUCHSCREEN)
                == InputDevice.SOURCE_TOUCHSCREEN) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && webView != null) {
                webView.requestUnbufferedDispatch(event);
            }
            nativeDrawingView.feedFromWindowEvent(event);
        }
        return super.dispatchTouchEvent(event);
    }

    private final class AndroidDrawingBridge {
        @JavascriptInterface
        public void setActive(boolean active) {
            drawingActive = active;
            runOnUiThread(() -> {
                if (nativeDrawingView != null) nativeDrawingView.setEnabledForDrawing(active);
            });
        }

        @JavascriptInterface
        public void setCanvasRect(double leftCss, double topCss,
                                  double rightCss, double bottomCss,
                                  double viewportWidthCss, double viewportHeightCss) {
            runOnUiThread(() -> {
                if (nativeDrawingView == null || webView == null) return;

                int[] webLoc = new int[2];
                int[] nativeLoc = new int[2];
                webView.getLocationOnScreen(webLoc);
                nativeDrawingView.getLocationOnScreen(nativeLoc);

                float vwCss = (float)Math.max(1.0, viewportWidthCss);
                float vhCss = (float)Math.max(1.0, viewportHeightCss);
                float sx = webView.getWidth() / vwCss;
                float sy = webView.getHeight() / vhCss;

                // Convert DOM client coordinates -> screen -> native-view local.
                float offsetX = webLoc[0] - nativeLoc[0];
                float offsetY = webLoc[1] - nativeLoc[1];
                RectF rect = new RectF(
                        offsetX + (float)leftCss * sx,
                        offsetY + (float)topCss * sy,
                        offsetX + (float)rightCss * sx,
                        offsetY + (float)bottomCss * sy);
                nativeDrawingView.setPaperRect(rect);
            });
        }

        @JavascriptInterface
        public void setBrush(String colorValue, double widthCss, double alpha,
                             double wet, boolean enabled, boolean eraser) {
            if (nativeDrawingView != null) {
                nativeDrawingView.setBrush(colorValue, (float)widthCss,
                        (float)alpha, (float)wet, enabled, eraser);
            }
        }

        @JavascriptInterface
        public void clearNative() {
            runOnUiThread(() -> {
                if (nativeDrawingView != null) nativeDrawingView.clearAll(true);
            });
        }

        @JavascriptInterface
        public void undoNative() {
            runOnUiThread(() -> {
                if (nativeDrawingView != null) nativeDrawingView.undo();
            });
        }

        @JavascriptInterface
        public void loadNativePng(String dataUrl) {
            if (nativeDrawingView != null) nativeDrawingView.loadDataUrl(dataUrl);
        }

        @JavascriptInterface
        public String getNativePngDataUrl() {
            return nativeDrawingView == null ? "" : nativeDrawingView.getPngDataUrl();
        }

        @JavascriptInterface
        public boolean hasNativeRecoveryState() {
            return nativeDrawingView != null && nativeDrawingView.hasRecoveryState();
        }
    }

    private final class NativeDrawingView extends View {
        private final Object bitmapLock = new Object();
        private final Paint corePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint haloPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path livePath = new Path();
        private final ArrayList<Bitmap> undo = new ArrayList<>();
        private final int[] viewScreenLocation = new int[2];

        private RectF paperRect = new RectF();
        private Bitmap bitmap;
        private Canvas bitmapCanvas;
        private Bitmap startupRecoveryBitmap;
        private volatile boolean recoveryAuthoritative = false;
        private volatile int recoveryGeneration = 0;

        private boolean enabledForDrawing = false;
        private boolean strokeActive = false;
        private boolean dryStrokeDirect = false;
        private boolean brushEnabled = false;
        private boolean brushEraser = false;

        private float brushWidthCss = 18f;
        private float brushWet = 0f;
        private int brushColor = Color.rgb(220,120,45);
        private int brushAlpha = 255;
        private float lastX = 0f, lastY = 0f;

        NativeDrawingView() {
            super(MainActivity.this);
            setBackgroundColor(Color.TRANSPARENT);
            setClickable(false);
            setFocusable(false);
            setLayerType(View.LAYER_TYPE_HARDWARE, null);

            corePaint.setStyle(Paint.Style.STROKE);
            corePaint.setStrokeCap(Paint.Cap.ROUND);
            corePaint.setStrokeJoin(Paint.Join.ROUND);

            haloPaint.setStyle(Paint.Style.STROKE);
            haloPaint.setStrokeCap(Paint.Cap.ROUND);
            haloPaint.setStrokeJoin(Paint.Join.ROUND);

            // v10.8.61: Android-native recovery is loaded independently of WebView.
            // It is applied when the real paper rectangle becomes known.
            try {
                File recoveryFile = new File(getFilesDir(), NATIVE_DRAWING_RECOVERY_FILE);
                if (recoveryFile.exists()) {
                    startupRecoveryBitmap = BitmapFactory.decodeFile(recoveryFile.getAbsolutePath());
                    recoveryAuthoritative = startupRecoveryBitmap != null;
                }
            } catch (Exception ignored) {}

            setVisibility(View.GONE);
        }

        void setEnabledForDrawing(boolean enabled) {
            enabledForDrawing = enabled;
            strokeActive = false;
            livePath.reset();
            setVisibility(enabled ? View.VISIBLE : View.GONE);
            invalidate();
        }

        void setPaperRect(RectF rect) {
            if (rect == null || rect.width() < 1f || rect.height() < 1f) return;
            RectF oldRect = paperRect;
            paperRect = new RectF(rect);

            int w = Math.max(1, Math.round(paperRect.width()));
            int h = Math.max(1, Math.round(paperRect.height()));
            synchronized (bitmapLock) {
                if (bitmap != null && bitmap.getWidth() == w && bitmap.getHeight() == h) {
                    invalidate();
                    return;
                }
                Bitmap next = Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);
                Canvas nextCanvas = new Canvas(next);
                if (bitmap != null && !bitmap.isRecycled()) {
                    nextCanvas.drawBitmap(bitmap,null,new Rect(0,0,w,h),null);
                    bitmap.recycle();
                } else if (startupRecoveryBitmap != null && !startupRecoveryBitmap.isRecycled()) {
                    nextCanvas.drawBitmap(startupRecoveryBitmap,null,new Rect(0,0,w,h),null);
                    startupRecoveryBitmap.recycle();
                    startupRecoveryBitmap = null;
                    recoveryAuthoritative = true;
                }
                bitmap = next;
                bitmapCanvas = nextCanvas;
            }
            invalidate();
        }

        void setBrush(String colorValue, float widthCss, float alpha,
                      float wet, boolean enabled, boolean eraser) {
            brushColor = parseWebColor(colorValue, brushColor);
            brushWidthCss = Math.max(1f,widthCss);
            brushAlpha = Math.max(0,Math.min(255,Math.round(alpha*255f)));
            brushWet = Math.max(0f,Math.min(1f,wet));
            brushEnabled = enabled;
            brushEraser = eraser;
        }

        private int parseWebColor(String value, int fallback) {
            if (value == null) return fallback;
            String s=value.trim();
            try {
                if (s.startsWith("rgb(") && s.endsWith(")")) {
                    String[] p=s.substring(4,s.length()-1).split(",");
                    if (p.length>=3) return Color.rgb(
                            Math.max(0,Math.min(255,Math.round(Float.parseFloat(p[0].trim())))),
                            Math.max(0,Math.min(255,Math.round(Float.parseFloat(p[1].trim())))),
                            Math.max(0,Math.min(255,Math.round(Float.parseFloat(p[2].trim())))));
                }
                if (s.startsWith("rgba(") && s.endsWith(")")) {
                    String[] p=s.substring(5,s.length()-1).split(",");
                    if (p.length>=3) return Color.rgb(
                            Math.max(0,Math.min(255,Math.round(Float.parseFloat(p[0].trim())))),
                            Math.max(0,Math.min(255,Math.round(Float.parseFloat(p[1].trim())))),
                            Math.max(0,Math.min(255,Math.round(Float.parseFloat(p[2].trim())))));
                }
                return Color.parseColor(s);
            } catch (Exception ignored) {
                return fallback;
            }
        }

        private void configurePaint() {
            // Paper-local bitmap uses Android pixels. CSS brush size is converted
            // with the actual paper ratio, not a device-wide DPR assumption.
            float cssPaperWidth = Math.max(1f, paperRect.width());
            float pxPerCss = 1f; // paperRect is already native pixels after DOM mapping
            float coreWidth = Math.max(1f, brushWidthCss * pxPerCss);

            corePaint.setColor(brushColor);
            corePaint.setAlpha(brushEraser ? 255 : brushAlpha);
            corePaint.setStrokeWidth(coreWidth);
            corePaint.setXfermode(brushEraser
                    ? new PorterDuffXfermode(PorterDuff.Mode.CLEAR)
                    : null);

            haloPaint.setColor(brushColor);
            haloPaint.setAlpha(brushEraser ? 0 : Math.max(0,Math.min(255,
                    Math.round((0.025f + brushWet*0.115f)*255f))));
            haloPaint.setStrokeWidth(Math.max(1f,
                    coreWidth*(1.18f + brushWet*0.72f)));
            haloPaint.setXfermode(brushEraser
                    ? new PorterDuffXfermode(PorterDuff.Mode.CLEAR)
                    : null);
        }

        private void ensureBitmap() {
            if (paperRect.width()<1f || paperRect.height()<1f) return;
            int w=Math.max(1,Math.round(paperRect.width()));
            int h=Math.max(1,Math.round(paperRect.height()));
            synchronized (bitmapLock) {
                if (bitmap!=null && bitmap.getWidth()==w && bitmap.getHeight()==h) return;
                bitmap=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);
                bitmapCanvas=new Canvas(bitmap);
            }
        }

        private void appendLivePoint(float px, float py, boolean force) {
            float dx = px-lastX, dy = py-lastY;
            if (!force && dx*dx + dy*dy < 0.1225f) return; // 0.35 px
            livePath.lineTo(px,py);
            lastX=px; lastY=py;
        }

        private boolean inPaper(float x,float y) {
            return !paperRect.isEmpty() && paperRect.contains(x,y);
        }
        private float lx(float x){ return x-paperRect.left; }
        private float ly(float y){ return y-paperRect.top; }

        boolean hasRecoveryState() {
            return recoveryAuthoritative;
        }

        private Bitmap recoverySnapshot() {
            synchronized (bitmapLock) {
                if (bitmap != null && !bitmap.isRecycled()) {
                    return bitmap.copy(Bitmap.Config.ARGB_8888, false);
                }
                if (startupRecoveryBitmap != null && !startupRecoveryBitmap.isRecycled()) {
                    return startupRecoveryBitmap.copy(Bitmap.Config.ARGB_8888, false);
                }
            }
            return null;
        }

        private boolean writeRecoverySnapshot(Bitmap snapshot, int generation) {
            if (snapshot == null || snapshot.isRecycled()) return false;
            File target = new File(getFilesDir(), NATIVE_DRAWING_RECOVERY_FILE);
            File temp = new File(getFilesDir(), NATIVE_DRAWING_RECOVERY_FILE + ".tmp");
            try {
                try (FileOutputStream out = new FileOutputStream(temp, false)) {
                    if (!snapshot.compress(Bitmap.CompressFormat.PNG, 100, out)) {
                        throw new IOException("native-drawing-recovery-compress");
                    }
                    out.flush();
                }
                if (generation != recoveryGeneration) {
                    temp.delete();
                    return false;
                }
                if (target.exists() && !target.delete()) {
                    throw new IOException("native-drawing-recovery-replace");
                }
                if (!temp.renameTo(target)) {
                    try (FileOutputStream out = new FileOutputStream(target, false)) {
                        if (!snapshot.compress(Bitmap.CompressFormat.PNG, 100, out)) {
                            throw new IOException("native-drawing-recovery-fallback");
                        }
                        out.flush();
                    }
                    temp.delete();
                }
                recoveryAuthoritative = true;
                return true;
            } catch (Exception ignored) {
                temp.delete();
                return false;
            } finally {
                snapshot.recycle();
            }
        }

        private void persistRecoveryAsync() {
            final Bitmap snapshot = recoverySnapshot();
            if (snapshot == null) return;
            final int generation = ++recoveryGeneration;
            recoveryAuthoritative = true;
            fileExecutor.execute(() -> writeRecoverySnapshot(snapshot, generation));
        }

        void persistRecoveryNow() {
            final Bitmap snapshot = recoverySnapshot();
            if (snapshot == null) return;
            final int generation = ++recoveryGeneration;
            recoveryAuthoritative = true;
            writeRecoverySnapshot(snapshot, generation);
        }

        private void pushUndo() {
            ensureBitmap();
            synchronized (bitmapLock) {
                if (bitmap==null) return;
                undo.add(bitmap.copy(Bitmap.Config.ARGB_8888,false));
                while (undo.size()>8) {
                    Bitmap old=undo.remove(0);
                    if (old!=null&&!old.isRecycled()) old.recycle();
                }
            }
        }

        void undo() {
            synchronized (bitmapLock) {
                if (undo.isEmpty()) return;
                Bitmap prev=undo.remove(undo.size()-1);
                if (bitmap!=null&&!bitmap.isRecycled()) bitmap.recycle();
                bitmap=prev.copy(Bitmap.Config.ARGB_8888,true);
                bitmapCanvas=new Canvas(bitmap);
                prev.recycle();
            }
            invalidate();
            persistRecoveryAsync();
            notifyWebCommitted();
        }

        void clearAll(boolean rememberUndo) {
            ensureBitmap();
            synchronized (bitmapLock) {
                if (bitmap==null) return;
                if (rememberUndo) pushUndo();
                bitmap.eraseColor(Color.TRANSPARENT);
            }
            livePath.reset();
            strokeActive=false;
            invalidate();
            persistRecoveryAsync();
            notifyWebCommitted();
        }

        void loadDataUrl(String dataUrl) {
            if (dataUrl==null || !dataUrl.startsWith("data:image")) return;
            final int comma=dataUrl.indexOf(',');
            if (comma<0) return;
            final String payload=dataUrl.substring(comma+1);
            fileExecutor.execute(() -> {
                try {
                    byte[] bytes=Base64.decode(payload,Base64.DEFAULT);
                    Bitmap decoded=BitmapFactory.decodeByteArray(bytes,0,bytes.length);
                    if (decoded==null) return;
                    runOnUiThread(() -> {
                        ensureBitmap();
                        synchronized (bitmapLock) {
                            if (bitmapCanvas!=null) {
                                bitmap.eraseColor(Color.TRANSPARENT);
                                bitmapCanvas.drawBitmap(decoded,null,
                                        new Rect(0,0,bitmap.getWidth(),bitmap.getHeight()),null);
                            }
                        }
                        decoded.recycle();
                        recoveryAuthoritative = true;
                        persistRecoveryAsync();
                        invalidate();
                    });
                } catch (Exception ignored) {}
            });
        }

        void feedFromWindowEvent(MotionEvent event) {
            if (!enabledForDrawing || paperRect.isEmpty()) return;

            // Activity MotionEvent coordinates are window-relative; NativeDrawingView
            // can have a different screen origin on different devices. Convert using
            // raw screen coordinates every time.
            getLocationOnScreen(viewScreenLocation);
            float x=event.getRawX()-viewScreenLocation[0];
            float y=event.getRawY()-viewScreenLocation[1];
            int action=event.getActionMasked();

            if (action==MotionEvent.ACTION_DOWN) {
                if (!brushEnabled || !inPaper(x,y)) {
                    strokeActive=false;
                    return;
                }
                ensureBitmap();
                pushUndo();
                configurePaint();
                dryStrokeDirect=brushEraser || brushWet<=0.08f;
                lastX=lx(x); lastY=ly(y);
                livePath.reset();
                livePath.moveTo(lastX,lastY);
                strokeActive=true;
                invalidate();
                return;
            }

            if (!strokeActive) return;

            if (action==MotionEvent.ACTION_MOVE) {
                float rawDx=event.getRawX()-event.getX();
                float rawDy=event.getRawY()-event.getY();

                for (int i=0;i<event.getHistorySize();i++) {
                    float hx=event.getHistoricalX(i)+rawDx-viewScreenLocation[0];
                    float hy=event.getHistoricalY(i)+rawDy-viewScreenLocation[1];
                    hx=Math.max(paperRect.left,Math.min(paperRect.right,hx));
                    hy=Math.max(paperRect.top,Math.min(paperRect.bottom,hy));
                    appendLivePoint(lx(hx),ly(hy),false);
                }

                float cx=Math.max(paperRect.left,Math.min(paperRect.right,x));
                float cy=Math.max(paperRect.top,Math.min(paperRect.bottom,y));
                appendLivePoint(lx(cx),ly(cy),false);

                invalidate();
            } else if (action==MotionEvent.ACTION_UP || action==MotionEvent.ACTION_CANCEL) {
                float cx=Math.max(paperRect.left,Math.min(paperRect.right,x));
                float cy=Math.max(paperRect.top,Math.min(paperRect.bottom,y));

                appendLivePoint(lx(cx),ly(cy),true);

                synchronized (bitmapLock) {
                    ensureBitmap();
                    configurePaint();
                    if (!brushEraser && brushWet>0.08f) {
                        bitmapCanvas.drawPath(livePath,haloPaint);
                    }
                    bitmapCanvas.drawPath(livePath,corePaint);
                }

                livePath.reset();
                dryStrokeDirect=false;
                strokeActive=false;
                recoveryAuthoritative = true;
                persistRecoveryAsync();
                invalidate();
                notifyWebCommitted();
            }
        }

        private void notifyWebCommitted() {
            if (webView==null) return;
            webView.post(() -> webView.evaluateJavascript(
                    "window.__shizukuruNativeStrokeCommitted&&window.__shizukuruNativeStrokeCommitted()",
                    null));
        }

        String getPngDataUrl() {
            synchronized (bitmapLock) {
                ensureBitmap();
                if (bitmap==null) return "";
                ByteArrayOutputStream out=new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG,100,out);
                return "data:image/png;base64,"+
                        Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            if (!enabledForDrawing || paperRect.isEmpty()) return;
            int save=canvas.save();
            canvas.clipRect(paperRect);
            synchronized (bitmapLock) {
                if (bitmap!=null) canvas.drawBitmap(bitmap,null,paperRect,null);
            }
            if (strokeActive && !livePath.isEmpty()) {
                configurePaint();
                canvas.translate(paperRect.left,paperRect.top);
                canvas.drawPath(livePath,corePaint);
            }
            canvas.restoreToCount(save);
        }
    }

    private final class SplashBridge {
        @JavascriptInterface
        public void ready() {
            runOnUiThread(MainActivity.this::dismissSplash);
        }
    }

    private void dismissSplash() {
        if (splashDismissed || splashView == null) return;
        splashDismissed = true;
        splashView.animate()
                .alpha(0f)
                .setDuration(220L)
                .withEndAction(() -> {
                    if (splashView != null) {
                        android.view.ViewParent parent = splashView.getParent();
                        if (parent instanceof FrameLayout) {
                            ((FrameLayout) parent).removeView(splashView);
                        }
                        splashView = null;
                    }
                })
                .start();
    }

    private final class ExternalLinkBridge {
        @JavascriptInterface
        public void openUrl(String url) {
            if (url == null) return;
            Uri uri;
            try {
                uri = Uri.parse(url);
            } catch (Throwable ignored) {
                return;
            }
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (!"https".equalsIgnoreCase(scheme)
                    || host == null
                    || !(host.equalsIgnoreCase("nullnode.studio")
                    || host.toLowerCase(java.util.Locale.ROOT).endsWith(".nullnode.studio"))) {
                return;
            }
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                } catch (Throwable ignored) {
                }
            });
        }
    }


    private boolean isActuallyInLockTaskMode() {
        try {
            android.app.ActivityManager activityManager =
                    (android.app.ActivityManager) getSystemService(ACTIVITY_SERVICE);
            return activityManager != null
                    && activityManager.getLockTaskModeState()
                    != android.app.ActivityManager.LOCK_TASK_MODE_NONE;
        } catch (Throwable ignored) {
            return false;
        }
    }

    private void notifyWebNavigationLockState(boolean locked) {
        if (webView == null) return;
        webView.evaluateJavascript(
                "window.ShizukuruDrawLock&&window.ShizukuruDrawLock.syncNativeState&&"
                        + "window.ShizukuruDrawLock.syncNativeState(" + (locked ? "true" : "false") + ");",
                null);
    }

    private void verifyPendingNavigationLock() {
        if (!pendingNavigationLock) return;
        if (isActuallyInLockTaskMode()) {
            pendingNavigationLock = false;
            pendingNavigationLockStartedAt = 0L;
            navigationLocked = true;
            applyImmersiveMode();
            notifyWebNavigationLockState(true);
            return;
        }

        // Android's pinning confirmation has no result callback.  Window focus is
        // not a reliable answer signal on every device, so keep polling instead of
        // treating an early focus return as a rejection.  The Web UI remains
        // unlocked until Lock Task mode is actually observed.
        long elapsed = android.os.SystemClock.elapsedRealtime() - pendingNavigationLockStartedAt;
        if (elapsed < 30000L) {
            if (webView != null) webView.postDelayed(this::verifyPendingNavigationLock, 160L);
            return;
        }

        pendingNavigationLock = false;
        pendingNavigationLockStartedAt = 0L;
        navigationLocked = false;
        applyUnlockedSystemUi();
        notifyWebNavigationLockState(false);
    }

    private final class AndroidLockBridge {
        @JavascriptInterface
        public void setLocked(boolean locked) {
            runOnUiThread(() -> {
                if (locked) {
                    pendingNavigationLock = true;
                    pendingNavigationLockStartedAt = android.os.SystemClock.elapsedRealtime();
                    navigationLocked = false;
                    try {
                        startLockTask();
                    } catch (IllegalArgumentException | IllegalStateException ignored) {
                        pendingNavigationLock = false;
                        pendingNavigationLockStartedAt = 0L;
                        notifyWebNavigationLockState(false);
                        return;
                    }
                    if (webView != null) {
                        webView.postDelayed(MainActivity.this::verifyPendingNavigationLock, 120L);
                    }
                } else {
                    pendingNavigationLock = false;
                    pendingNavigationLockStartedAt = 0L;
                    navigationLocked = false;
                    try {
                        stopLockTask();
                    } catch (IllegalArgumentException | IllegalStateException ignored) {
                    }
                    applyUnlockedSystemUi();
                    notifyWebNavigationLockState(false);
                }
            });
        }
    }

    /**
     * v10.4.7 native export bridge.
     * PNG creation happens in WebView, while disk I/O and Android sharing happen
     * natively on a worker thread. This avoids unreliable blob downloads / Web Share
     * inside Android WebView and keeps the UI responsive during file I/O.
     */
    private final class AndroidFilesBridge {
        @JavascriptInterface
        public void savePng(String dataUrl, String filename) {
            fileExecutor.execute(() -> {
                try {
                    Bitmap bitmap = decodePngDataUrl(dataUrl);
                    Uri saved = saveBitmapToPictures(bitmap, sanitizeFilename(filename));
                    bitmap.recycle();
                    notifyExportResult("save", true,
                            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                                    ? "写真の「Shizukuru」フォルダへ保存しました"
                                    : "Shizukuruの画像フォルダへ保存しました");
                } catch (Throwable error) {
                    notifyExportResult("save", false, "保存できませんでした");
                }
            });
        }

        @JavascriptInterface
        public void sharePng(String dataUrl, String filename) {
            fileExecutor.execute(() -> {
                try {
                    Bitmap bitmap = decodePngDataUrl(dataUrl);
                    File shareDir = new File(getCacheDir(), "shares");
                    if (!shareDir.exists() && !shareDir.mkdirs()) {
                        throw new IOException("share-dir");
                    }
                    File outFile = new File(shareDir, sanitizeFilename(filename));
                    writeBitmap(bitmap, outFile);
                    bitmap.recycle();

                    Uri uri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            outFile);

                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("image/png");
                    send.putExtra(Intent.EXTRA_STREAM, uri);
                    send.putExtra(Intent.EXTRA_SUBJECT, "Shizukuruで描いた絵");
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    Intent chooser = Intent.createChooser(send, "描いた絵を共有");
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    runOnUiThread(() -> {
                        try {
                            // Sharing must temporarily leave Lock Task because the Android
                            // chooser / destination app is outside Shizukuru. The lock state
                            // itself is preserved and is restored when focus returns.
                            externalShareActive = true;
                            if (navigationLocked) {
                                try {
                                    stopLockTask();
                                } catch (IllegalArgumentException | IllegalStateException ignored) {
                                }
                            }
                            startActivity(chooser);
                            notifyExportResult("share", true, "共有画面を開きました");
                        } catch (Throwable error) {
                            externalShareActive = false;
                            notifyExportResult("share", false, "共有画面を開けませんでした");
                        }
                    });
                } catch (Throwable error) {
                    notifyExportResult("share", false, "共有できませんでした");
                }
            });
        }
    }

    private Bitmap decodePngDataUrl(String dataUrl) throws IOException {
        if (dataUrl == null) throw new IOException("missing-data");
        int comma = dataUrl.indexOf(',');
        String payload = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
        byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
        Bitmap source = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        if (source == null) throw new IOException("decode-failed");

        // Drawing canvas itself is transparent. Composite it over the same warm white
        // paper used in the app so the saved/shared PNG looks identical everywhere.
        Bitmap flattened = Bitmap.createBitmap(
                source.getWidth(), source.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(flattened);
        canvas.drawColor(Color.rgb(255, 254, 250));
        canvas.drawBitmap(source, 0f, 0f, null);
        source.recycle();
        return flattened;
    }

    private String sanitizeFilename(String filename) {
        String name = filename == null ? "Shizukuru.png" : filename;
        name = name.replaceAll("[^A-Za-z0-9._-]", "_");
        if (!name.toLowerCase().endsWith(".png")) name += ".png";
        return name;
    }

    private Uri saveBitmapToPictures(Bitmap bitmap, String filename) throws IOException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver resolver = getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
            values.put(MediaStore.Images.Media.RELATIVE_PATH,
                    Environment.DIRECTORY_PICTURES + "/Shizukuru");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);

            Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IOException("mediastore-insert");
            try (OutputStream stream = resolver.openOutputStream(uri, "w")) {
                if (stream == null || !bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)) {
                    resolver.delete(uri, null, null);
                    throw new IOException("mediastore-write");
                }
            }
            values.clear();
            values.put(MediaStore.Images.Media.IS_PENDING, 0);
            resolver.update(uri, values, null, null);
            return uri;
        }

        File root = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        if (root == null) throw new IOException("pictures-dir");
        File dir = new File(root, "Shizukuru");
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("pictures-mkdir");
        File out = new File(dir, filename);
        writeBitmap(bitmap, out);
        return Uri.fromFile(out);
    }

    private void writeBitmap(Bitmap bitmap, File out) throws IOException {
        try (OutputStream stream = new FileOutputStream(out, false)) {
            if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)) {
                throw new IOException("png-write");
            }
        }
    }

    private void notifyExportResult(String operation, boolean success, String message) {
        runOnUiThread(() -> {
            if (webView == null) return;
            String js = "window.__shizukuruNativeExportResult&&window.__shizukuruNativeExportResult("
                    + JSONObject.quote(operation) + ","
                    + (success ? "true" : "false") + ","
                    + JSONObject.quote(message) + ");";
            webView.evaluateJavascript(js, null);
        });
    }

    @Override
    public void onBackPressed() {
        if (navigationLocked) {
            if (webView != null) {
                webView.evaluateJavascript(
                        "(function(){var e=document.getElementById('drawLockMark');if(e){e.classList.add('show');setTimeout(function(){e.classList.remove('show')},620)}})()",
                        null);
            }
            applyImmersiveMode();
            return;
        }

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            moveTaskToBack(true);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;

        if (pendingNavigationLock) {
            if (webView != null) webView.postDelayed(this::verifyPendingNavigationLock, 80L);
        }

        if (externalShareActive) {
            externalShareActive = false;
            if (navigationLocked) {
                applyImmersiveMode();
                try {
                    startLockTask();
                } catch (IllegalArgumentException | IllegalStateException ignored) {
                }
            } else {
                applyUnlockedSystemUi();
            }
            return;
        }

        if (navigationLocked) {
            applyImmersiveMode();
        } else {
            applyUnlockedSystemUi();
        }
    }

    @Override
    protected void onPause() {
        // v10.8.61: WebView/IndexedDB async work is not guaranteed to finish when
        // Android backgrounds or terminates the Activity. Persist the authoritative
        // native drawing synchronously before leaving the foreground.
        if (nativeDrawingView != null) {
            nativeDrawingView.persistRecoveryNow();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.post(() -> {
                if (externalShareActive) return;
                if (navigationLocked) {
                    applyImmersiveMode();
                } else {
                    applyUnlockedSystemUi();
                }
            });
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        outState.putBoolean("navigationLocked", navigationLocked);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        navigationLocked = savedInstanceState.getBoolean("navigationLocked", false);
    }

    @Override
    protected void onDestroy() {
        if (nativeDrawingView != null) {
            nativeDrawingView.persistRecoveryNow();
        }
        fileExecutor.shutdownNow();
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
