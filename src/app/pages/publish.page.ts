import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

type Status = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-publish',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div class="w-full max-w-md">

        <!-- Header -->
        <div class="text-center mb-8">
          <span class="text-4xl">🏄</span>
          <h1 class="text-2xl font-bold text-white mt-3">Post veröffentlichen</h1>
          <p class="text-gray-400 text-sm mt-1">StreetSurfClub — Publish Pipeline</p>
        </div>

        <!-- Card -->
        <div class="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">

          @if (status() === 'success') {
            <!-- Success state -->
            <div class="text-center py-4">
              <div class="text-5xl mb-4">✅</div>
              <h2 class="text-white font-semibold text-lg">Pipeline gestartet!</h2>
              <p class="text-gray-400 text-sm mt-2">
                Labels werden gesetzt, Routen generiert und die Website neu gebaut.
              </p>
              <p class="text-gray-500 text-xs mt-3">
                Job ID: <code class="text-emerald-400">{{ jobId() }}</code>
              </p>
              <p class="text-gray-500 text-xs mt-1">Die Website ist in ca. 5–10 Minuten aktuell.</p>
              <button
                (click)="reset()"
                class="mt-6 text-sm text-emerald-400 hover:text-emerald-300 underline">
                Weiteren Post veröffentlichen
              </button>
            </div>

          } @else {
            <!-- Form -->
            <form (ngSubmit)="submit()" #f="ngForm">

              <label class="block text-sm font-medium text-gray-300 mb-2">
                Blogger Post-URL
              </label>
              <input
                type="url"
                name="postUrl"
                [(ngModel)]="postUrl"
                required
                placeholder="https://www.blogger.com/blog/post/edit/…"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                       text-white placeholder-gray-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       transition"
              />

              <p class="text-gray-500 text-xs mt-2">
                Öffne den Post in Blogger, kopiere die URL aus der Adressleiste und füge sie hier ein.
              </p>

              @if (status() === 'error') {
                <div class="mt-4 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3">
                  <p class="text-red-400 text-sm">{{ errorMessage() }}</p>
                </div>
              }

              <button
                type="submit"
                [disabled]="status() === 'loading' || !postUrl"
                class="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700
                       disabled:text-gray-500 text-white font-semibold rounded-lg py-3
                       transition text-sm">
                @if (status() === 'loading') {
                  <span>Wird gestartet…</span>
                } @else {
                  <span>🚀 Veröffentlichen</span>
                }
              </button>

            </form>
          }

        </div>

        <p class="text-center text-gray-600 text-xs mt-6">
          Nur für autorisierte Benutzer · StreetSurfClub
        </p>

      </div>
    </div>
  `,
})
export default class PublishPage {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  postUrl = '';
  status = signal<Status>('idle');
  errorMessage = signal('');
  jobId = signal('');

  private get secretKey(): string {
    return this.route.snapshot.queryParamMap.get('key') ?? '';
  }

  submit() {
    if (!this.postUrl || this.status() === 'loading') return;

    this.status.set('loading');
    this.errorMessage.set('');

    this.http.post<{ ok: boolean; jobId: string; message: string }>(
      `/api/v1/publish-post?key=${encodeURIComponent(this.secretKey)}`,
      { postUrl: this.postUrl }
    ).subscribe({
      next: (res) => {
        this.jobId.set(res.jobId ?? '');
        this.status.set('success');
      },
      error: (err) => {
        const msg = err?.error?.statusMessage ?? err?.message ?? 'Unbekannter Fehler';
        this.errorMessage.set(msg);
        this.status.set('error');
      },
    });
  }

  reset() {
    this.postUrl = '';
    this.status.set('idle');
    this.errorMessage.set('');
    this.jobId.set('');
  }
}
