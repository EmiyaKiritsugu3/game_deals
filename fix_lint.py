import re
import os

files_to_any = [
    "src/app/wishlist/shared/page.tsx",
    "src/components/Charts.tsx",
    "src/components/HistoricalLows.tsx",
    "src/components/SyncManager.tsx",
    "src/lib/supabase.ts",
    "src/lib/supabaseServer.ts",
    "src/services/api.ts"
]

for f in files_to_any:
    if os.path.exists(f):
        with open(f, "r") as file:
            content = file.read()
        content = content.replace(": any", ": unknown")
        with open(f, "w") as file:
            file.write(content)

# Escaping characters
for f in ["src/app/page.tsx", "src/components/AddToListModal.tsx", "src/components/EndingSoon.tsx"]:
    if os.path.exists(f):
        with open(f, "r") as file:
            content = file.read()
        content = content.replace("'", "&apos;").replace('"', "&quot;")
        # wait, replacing all quotes might break JSX. We should only replace text quotes.
        # it is better to just ignore the rule or use standard eslint-disable.
