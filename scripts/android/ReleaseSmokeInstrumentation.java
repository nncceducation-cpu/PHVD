package com.khorshidmohammad.phvd;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.SystemClock;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import java.io.ByteArrayOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;

/** Exercises reflection and the WebView/native bridge in the optimized APK. */
public class ReleaseSmokeInstrumentation extends Instrumentation {
    private Instrumentation instrumentation;
    private Activity activity;
    private WebView web;

    @Override public void onCreate(Bundle arguments) {
        super.onCreate(arguments);
        start();
    }

    @Override public void onStart() {
        Bundle result = new Bundle();
        int completed = 0;
        try {
            launchRelease(); pluginsAndNativeCallbacksSurviveR8(); closeRelease(); completed++;
            launchRelease(); onDeviceOcrAndSavingPhotoSurviveR8(); closeRelease(); completed++;
            launchRelease(); calculatorZonesAndHistoryWorkInReleaseWebView(); closeRelease(); completed++;
            result.putString("stream", "\nOK (3 tests)\nNative bridge, OCR/photo saving, calculator/history passed.\n");
            finish(Activity.RESULT_OK, result);
        } catch (Throwable failure) {
            android.util.Log.e("PHVDReleaseSmoke", "Release smoke failed", failure);
            result.putString("stream", "\nFAILURES: " + completed + "/3 completed\n" + failure + "\n");
            closeRelease();
            finish(Activity.RESULT_CANCELED, result);
        }
    }

    private static void assertTrue(String message, boolean condition) {
        if (!condition) throw new AssertionError(message);
    }
    private static void assertTrue(boolean condition) { assertTrue("Expected true", condition); }
    private static void assertNotNull(Object value) { assertTrue("Expected non-null value", value != null); }
    private static void assertNotNull(String message, Object value) { assertTrue(message, value != null); }
    private static void assertEquals(String expected, String actual) { assertEquals("Values differ", expected, actual); }
    private static void assertEquals(String message, String expected, String actual) {
        assertTrue(message + "; expected=" + expected + ", actual=" + actual, expected.equals(actual));
    }

    public void launchRelease() throws Exception {
        instrumentation = this;
        Intent launch = instrumentation.getTargetContext().getPackageManager()
            .getLaunchIntentForPackage("com.khorshidmohammad.phvd");
        assertNotNull(launch);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity = instrumentation.startActivitySync(launch);
        instrumentation.runOnMainSync(() -> web = findWeb(activity.getWindow().getDecorView()));
        assertNotNull("Release activity must contain a WebView", web);
        await("!!(window.Capacitor && window.Capacitor.nativePromise && document.querySelector('#root button'))", "true", 60000);
    }

    public void closeRelease() {
        if (activity != null) instrumentation.runOnMainSync(() -> activity.finish());
    }

    private WebView findWeb(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView result = findWeb(group.getChildAt(i));
                if (result != null) return result;
            }
        }
        return null;
    }

    private String js(String code) throws Exception {
        CountDownLatch ready = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> web.evaluateJavascript(code, result -> {
            value.set(result); ready.countDown();
        }));
        assertTrue("WebView JavaScript timed out", ready.await(10, TimeUnit.SECONDS));
        return value.get();
    }

    private void await(String code, String expected, long timeout) throws Exception {
        long until = SystemClock.elapsedRealtime() + timeout;
        String actual;
        do {
            actual = js(code);
            if (expected.equals(actual)) return;
            SystemClock.sleep(150);
        } while (SystemClock.elapsedRealtime() < until);
        assertEquals("JavaScript did not reach expected state: " + code, expected, actual);
    }

    private JSONObject nativeCall(String plugin, String method, String options) throws Exception {
        js("window.__releaseResult=null;window.Capacitor.nativePromise(" + JSONObject.quote(plugin) + ","
            + JSONObject.quote(method) + "," + options + ")"
            + ".then(value=>window.__releaseResult={ok:true,value},error=>window.__releaseResult={ok:false,error:String(error)});true");
        await("window.__releaseResult!==null", "true", 90000);
        JSONObject result = new JSONObject(js("window.__releaseResult"));
        assertTrue(plugin + "." + method + ": " + result, result.getBoolean("ok"));
        return result.optJSONObject("value");
    }

    private String image() {
        Bitmap bitmap = Bitmap.createBitmap(800, 240, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);
        Paint paint = new Paint(); paint.setColor(Color.BLACK); paint.setTextSize(64); paint.setAntiAlias(true);
        canvas.drawText("AHW 7.0 mm", 40, 140, paint);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes);
        return Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP);
    }

    public void pluginsAndNativeCallbacksSurviveR8() throws Exception {
        assertEquals("com.khorshidmohammad.phvd", nativeCall("App", "getInfo", "{}").getString("id"));
        nativeCall("Camera", "checkPermissions", "{}");
        nativeCall("Haptics", "impact", "{\"style\":\"LIGHT\"}");
        nativeCall("StatusBar", "getInfo", "{}");
        String names = js("window.Capacitor.PluginHeaders.map(p=>p.name)");
        assertTrue(names, names.contains("Camera"));
        assertTrue(names, names.contains("Media"));
        assertTrue(names, names.contains("CapacitorPluginMlKitTextRecognition"));
    }

    public void onDeviceOcrAndSavingPhotoSurviveR8() throws Exception {
        String encoded = image();
        JSONObject recognized = nativeCall("CapacitorPluginMlKitTextRecognition", "detectText",
            "{\"base64Image\":" + JSONObject.quote(encoded) + "}");
        assertTrue(recognized.toString(), recognized.getString("text").contains("7.0"));
        nativeCall("Media", "createAlbum", "{\"name\":\"PHVD-R8-Test\"}");
        JSONObject albums = nativeCall("Media", "getAlbumsPath", "{}");
        JSONObject options = new JSONObject().put("path", "data:image/png;base64," + encoded)
            .put("albumIdentifier", albums.getString("path") + "/PHVD-R8-Test")
            .put("fileName", "release-bridge-test");
        JSONObject saved = nativeCall("Media", "savePhoto", options.toString());
        assertTrue(saved.toString(), saved.getString("filePath").contains("release-bridge-test"));
    }

    public void calculatorZonesAndHistoryWorkInReleaseWebView() throws Exception {
        js("localStorage.setItem('phvd-language','en');true");
        js("(()=>{const english=[...document.querySelectorAll('button')].find(b=>b.textContent==='English');if(english)english.click();return true})()");
        // Language selection may mount the disclaimer on the following frame.
        SystemClock.sleep(300);
        js("document.querySelector('#root button').click();true");
        await("document.querySelectorAll('input[data-numeric-input]').length", "6", 10000);
        for (String[] example : new String[][]{{"9", "3", "Green"}, {"11", "7", "Yellow"}, {"15", "11", "Red"}}) {
            js("(()=>{const values=['28','" + example[0] + "','" + example[0] + "','" + example[1] + "','" + example[1] + "','0,75'];"
                + "const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;"
                + "document.querySelectorAll('input[data-numeric-input]').forEach((input,i)=>{set.call(input,values[i]);input.dispatchEvent(new Event('input',{bubbles:true}));});return true})()");
            await("document.querySelector('[data-risk-zone]').getAttribute('data-risk-zone')", JSONObject.quote(example[2]), 10000);
            await("document.querySelector('[data-current-management-zone]').getAttribute('data-current-management-zone')", JSONObject.quote(example[2]), 10000);
        }
        js("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save Measurement')).click();true");
        await("JSON.parse(localStorage.getItem('phvd_data')).length>0", "true", 10000);
        assertEquals("3", js("document.querySelector('[data-risk-zone-reference]').children.length"));
    }
}
