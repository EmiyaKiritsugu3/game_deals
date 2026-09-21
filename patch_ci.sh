cat << 'INNER_EOF' > ci.patch
--- .github/workflows/ci.yml
+++ .github/workflows/ci.yml
@@ -41,8 +41,7 @@
       - name: Lint
         run: bunx biome check src/
       - name: Dependency audit
-        # Ignore audit errors for now until bun updates handle large deps properly
-        run: bun audit --audit-level=high || true
+        run: bun audit --audit-level=high
       - name: Type check
         run: bunx tsc --noEmit
       - name: Unit Tests + Coverage
INNER_EOF
patch .github/workflows/ci.yml < ci.patch
rm ci.patch
