# Retain the WebView's JavaScript entry points after shrinking/renaming.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor discovers plugins and permission/activity callbacks by reflection.
# Its supplied consumer rules keep those plugin classes and members; do not
# disable shrinking, optimization or obfuscation for entire library packages.
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
