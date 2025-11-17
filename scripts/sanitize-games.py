import json, sys, os, re

def looks_mojibake(s: str) -> bool:
    if not isinstance(s, str):
        return False
    if not s:
        return False
    # Replacement char indicates irreversible loss
    if '\ufffd' in s:
        return True
    # Too many control or placeholder sequences
    bad = sum(ch in '\uFFFD\uFFFE\uFFFF' for ch in s)
    if bad:
        return True
    # Heuristic: lots of isolated punctuation with very few letters
    letters = sum(ch.isalpha() for ch in s)
    if letters < max(3, len(s) // 10) and any(ord(ch) > 127 for ch in s):
        return True
    return False

def sanitize_text(obj, fallback_en):
    # obj can be string or dict of lang->string
    if isinstance(obj, str):
        return obj
    if not isinstance(obj, dict):
        return obj
    out = {}
    for lang, val in obj.items():
        if isinstance(val, str) and looks_mojibake(val):
            out[lang] = fallback_en or ''
        else:
            out[lang] = val
    return out

def sanitize_list(obj, fallback_en):
    # handle list of strings or dict lang->list
    if isinstance(obj, list):
        return [fallback_en if looks_mojibake(x) else x for x in obj]
    if isinstance(obj, dict):
        out = {}
        for lang, arr in obj.items():
            if isinstance(arr, list):
                out[lang] = [fallback_en if looks_mojibake(x) else x for x in arr]
            else:
                out[lang] = arr
        return out
    return obj

def main(path):
    data = json.load(open(path, 'r', encoding='utf-8'))
    changed = False
    for g in data:
        en_title = None
        if isinstance(g.get('title'), dict):
            en_title = g['title'].get('en')
        # fields that can contain text
        for key in ('title','description','longDescription'):
            if key in g:
                before = g[key]
                g[key] = sanitize_text(g[key], en_title or g.get('id',''))
                if g[key] != before:
                    changed = True
        for key in ('tags','features'):
            if key in g:
                before = g[key]
                g[key] = sanitize_list(g[key], en_title or g.get('id',''))
                if g[key] != before:
                    changed = True
    if changed:
        backup = path + '.bak'
        if not os.path.exists(backup):
            with open(backup, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print('Sanitized and saved:', path)
    else:
        print('No changes needed')

if __name__ == '__main__':
    p = sys.argv[1] if len(sys.argv)>1 else 'assets/data/games.json'
    main(p)

