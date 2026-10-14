# Retain the WebView's JavaScript entry points after shrinking/renaming.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor discovers plugins and permission/activity callbacks by reflection.
# Its supplied consumer rules keep those plugin classes and members; do not
# disable shrinking, optimization or obfuscation for entire library packages.
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault

# R8 full mode requires the annotation types themselves to be kept as well.
# Otherwise a plugin can load while its permissions annotation becomes null,
# crashing Camera.checkPermissions and permission-dependent media operations.
-keep @interface com.getcapacitor.** { *; }
