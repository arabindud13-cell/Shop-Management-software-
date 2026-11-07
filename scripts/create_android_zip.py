import os
import zipfile

def create_android_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    android_dir = os.path.join(base_dir, 'android')
    public_dir = os.path.join(base_dir, 'public')
    os.makedirs(public_dir, exist_ok=True)
    
    zip_filename = 'radhamadhab-sms-sender-android-project.zip'
    output_path = os.path.join(public_dir, zip_filename)
    root_output_path = os.path.join(base_dir, zip_filename)
    
    exclude_dirs = {'.gradle', 'build', '.idea', '.git'}
    exclude_files = {'.DS_Store'}
    
    print(f"Archiving Android project from {android_dir} to {output_path}...")
    
    count = 0
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(android_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for f in files:
                if f in exclude_files or f.endswith('.zip'):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, android_dir)
                zf.write(full_path, rel_path)
                count += 1
                
    import shutil
    shutil.copy2(output_path, root_output_path)
    
    size_kb = os.path.getsize(output_path) / 1024
    print(f"Successfully created Android zip archive with {count} files ({size_kb:.2f} KB).")
    print(f"Location: {output_path}")

if __name__ == '__main__':
    create_android_zip()
