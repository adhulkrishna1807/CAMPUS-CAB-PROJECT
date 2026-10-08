import os
import zipfile

zip_name = r'c:\Users\91759\Music\Campus_Cab_Project.zip'
root_dir = r'c:\Users\91759\Music\BUG ARENA'
exclude_dirs = {'node_modules', '.next', '__pycache__', '.git', '.venv', '.gemini', 'build', 'dist'}
exclude_exts = {'.pyc', '.pyo', '.log'}

count = 0
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            ext = os.path.splitext(f)[1]
            if ext in exclude_exts or f.endswith('.zip'):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, root_dir)
            zf.write(full_path, rel_path)
            count += 1

size_kb = os.path.getsize(zip_name) / 1024
print(f"ZIP Complete: {zip_name} | {count} files packaged | {size_kb:.1f} KB")
