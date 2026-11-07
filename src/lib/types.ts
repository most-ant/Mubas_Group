export type TeamMember = { id: string; name: string | null; role: string | null; bio: string | null; photo: string | null }
export type Job = { id: string; title: string; type: string | null; location: string | null; deadline: string | null; description: string | null; created_at: string }
export type GalleryItem = { id: string; asset: string | null; caption: string | null; credit: string | null; is_official: boolean; status: 'pending' | 'approved'; uploaded_by: string | null; created_at: string }
export type Application = { id: string; name: string; email: string; phone: string | null; job_id: string | null; job_title: string; message: string; status: 'pending' | 'received'; user_id?: string | null; created_at: string }
export type Message = { id: string; user_id: string; user_email: string; content: string; admin_reply: string | null; created_at: string; replied_at: string | null }
export type Notification = { id: string; user_id: string; type: string; message: string; is_read: boolean; created_at: string }
