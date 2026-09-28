# RMSProject.spec
# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_submodules
import os

block_cipher = None

# ------------------------------------------------------------------
# Bundle static files and templates
# ------------------------------------------------------------------
datas = []

# Static files (from collectstatic)
if os.path.exists('staticfiles'):
    datas.append(('staticfiles', 'staticfiles'))

# Project-level templates
if os.path.exists('templates'):
    datas.append(('templates', 'templates'))

# App-level templates and static
if os.path.exists('half_wife/templates'):
    datas.append(('half_wife/templates', 'half_wife/templates'))
if os.path.exists('half_wife/static'):
    datas.append(('half_wife/static', 'half_wife/static'))

# ------------------------------------------------------------------
# Hidden imports Django needs at runtime
# ------------------------------------------------------------------
hiddenimports = (
    collect_submodules('django')
    + collect_submodules('whitenoise')
    + collect_submodules('waitress')
    + collect_submodules('webview')
    + [
        'restaurant.settings',
        'restaurant.wsgi',
        'restaurant.urls',
        'half_wife',
        'half_wife.urls',
        'half_wife.models',
        'half_wife.views',
        'half_wife.admin',
        'half_wife.apps',
    ]
)

a = Analysis(
    ['launcher.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='RMSProject',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,          # 👈 TRUE for first build — shows terminal for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)