cat << 'INNER_EOF' > pkg.patch
--- package.json
+++ package.json
@@ -2,7 +2,7 @@
   "name": "game-deals",
   "version": "0.1.0",
   "private": true,
-  "packageManager": "bun@1.3.13",
+  "packageManager": "bun@1.3.13",
   "resolutions": {
-    "adm-zip": "^0.6.0",
+    "adm-zip": "^0.6.1",
     "axios": "^1.18.0",
@@ -37,7 +37,7 @@
     "fast-uri": "^3.1.7",
     "input-otp": "^1.4.2",
     "lucide-react": "^1.21.0",
-    "next": "16.2.11",
+    "next": "^16.3.3",
     "next-themes": "^0.4.6",
     "postgres": "^3.4.9",
-    "react": "19.2.7",
-    "react-dom": "19.2.7",
+    "react": "^19.3.0",
+    "react-dom": "^19.3.0",
     "recharts": "^3.9.0",
-    "sharp": "^0.35.3",
+    "sharp": "^0.35.4",
     "sonner": "^2.0.7",
@@ -62,7 +62,7 @@
     "nanoid": "^3.3.16",
     "postcss": "^8.5.10",
-    "sharp": "^0.35.0",
+    "sharp": "^0.35.4",
     "undici": "^7.28.0"
   },
INNER_EOF
patch package.json < pkg.patch
rm pkg.patch
