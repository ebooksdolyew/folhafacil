#!/usr/bin/env python3
"""Compara exports do GHUB contra o baseline. Uso: python3 comparar.py <pasta_nova>"""
import sys, os, zipfile, hashlib, re
from pathlib import Path

BASE = Path("validacao/baseline")
NOVA = Path(sys.argv[1] if len(sys.argv) > 1 else "validacao/atual")

def sheet_xml(p):
    """Extrai a planilha interna do .xlsx (ignora metadados que podem variar)."""
    with zipfile.ZipFile(p) as z:
        return z.read("xl/worksheets/sheet1.xml")

def norm_txt(p):
    """Normaliza o relatório: remove data/hora e tempo de processamento."""
    t = p.read_text(encoding="utf-8", errors="ignore")
    t = re.sub(r"\d{2}/\d{2}/\d{4}[ ,]*\d{2}:\d{2}(:\d{2})?", "<DATAHORA>", t)
    t = re.sub(r"Concluído em [\d.]+s", "Concluído em <T>s", t)
    t = re.sub(r"\d+[.,]\d+\s*s\b", "<T>s", t)
    return t

falhas, testados = 0, 0
for base_file in sorted(BASE.iterdir()):
    nova_file = NOVA / base_file.name
    if not nova_file.exists():
        print(f"❌ AUSENTE: {base_file.name}"); falhas += 1; continue
    testados += 1
    if base_file.suffix == ".xlsx":
        ok = sheet_xml(base_file) == sheet_xml(nova_file)
    else:
        a, b = norm_txt(base_file), norm_txt(nova_file)
        ok = a == b
        if not ok:
            la, lb = a.splitlines(), b.splitlines()
            for i, (x, y) in enumerate(zip(la, lb)):
                if x != y:
                    print(f"   linha {i+1}:\n     BASE: {x}\n     NOVA: {y}")
                    break
            if len(la) != len(lb):
                print(f"   nº de linhas: base={len(la)} nova={len(lb)}")
    print(("✅ IDÊNTICO: " if ok else "❌ DIVERGENTE: ") + base_file.name)
    if not ok: falhas += 1

print(f"\n{'='*50}\n{testados} arquivo(s) testado(s) · {falhas} divergência(s)")
sys.exit(1 if falhas else 0)
