-- Add ON DELETE CASCADE for attendance_sessions, qr_tokens, and attendance referencing classes
ALTER TABLE public.attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_class_id_fkey,
  ADD CONSTRAINT attendance_sessions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.qr_tokens DROP CONSTRAINT IF EXISTS qr_tokens_class_id_fkey,
  ADD CONSTRAINT qr_tokens_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_class_id_fkey,
  ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
