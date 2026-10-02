import { Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/components/toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private toastService = inject(ToastService);

  async copyText(text: string, label: string = 'Copied to clipboard'): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.toastService.success(label);
        return true;
      } else {
        // Fallback for non-secure context
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          this.toastService.success(label);
          return true;
        }
      }
    } catch (err) {
      console.error('Clipboard copy failed', err);
      this.toastService.error('Failed to copy to clipboard');
    }
    return false;
  }
}
