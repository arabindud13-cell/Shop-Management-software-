import os
import zipfile
import sys

def create_project_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    public_dir = os.path.join(base_dir, 'public')
    os.makedirs(public_dir, exist_ok=True)
    
    zip_filename = 'radhamadhab-online-center-full-website.zip'
    output_path = os.path.join(public_dir, zip_filename)
    root_output_path = os.path.join(base_dir, zip_filename)
    
    # Files and folders to exclude
    exclude_dirs = {
        'node_modules',
        '.git',
        '.aistudio',
        'dist',
        'build',
        'coverage',
        '.cache',
        '__pycache__'
    }
    exclude_files = {
        zip_filename,
        '.DS_Store'
    }
    
    print(f"Archiving project from {base_dir} to {output_path}...")
    
    count = 0
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.git')]
            
            # Skip public directory itself if it contains the zip
            rel_dir = os.path.relpath(root, base_dir)
            if rel_dir == 'public':
                pass
            
            for f in files:
                if f in exclude_files or f.endswith('.zip') or f.endswith('.pyc') or f.endswith('.log'):
                    continue
                
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                
                # Prevent including the zip file into itself
                if rel_path.endswith('.zip'):
                    continue
                
                zf.write(full_path, rel_path)
                count += 1

    # Also copy to root for convenience
    import shutil
    shutil.copy2(output_path, root_output_path)
    
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Successfully created zip archive with {count} files ({size_mb:.2f} MB).")
    print(f"Locations:")
    print(f"  - {output_path}")
    print(f"  - {root_output_path}")

if __name__ == '__main__':
    create_project_zip()
