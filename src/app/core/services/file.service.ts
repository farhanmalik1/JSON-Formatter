import { Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/components/toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private toastService = inject(ToastService);

  readFile(file: File): Promise<{ content: string; filename: string; size: number }> {
    return new Promise((resolve, reject) => {
      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json' && file.type !== 'text/plain') {
        this.toastService.error('Please upload a valid JSON file');
        reject(new Error('Invalid file type'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string || '';
        resolve({
          content,
          filename: file.name,
          size: file.size
        });
      };
      reader.onerror = () => {
        this.toastService.error('Failed to read file');
        reject(reader.error);
      };
      reader.readAsText(file);
    });
  }

  downloadJson(content: string, filename: string = 'data.json') {
    if (!content) return;
    try {
      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.toastService.success(`Downloaded ${filename}`);
    } catch (err) {
      this.toastService.error('Download failed');
    }
  }
}
