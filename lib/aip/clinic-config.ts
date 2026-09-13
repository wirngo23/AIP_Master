import { z } from 'zod';
export function secureClinicLink(v:string){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!['localhost','127.0.0.1'].includes(u.hostname);}catch{return false;}}
const optionalLink=z.string().trim().max(500).refine(v=>v===''||secureClinicLink(v),'Use a secure HTTPS link.').default('');
export const clinicConfigSchema=z.object({
 name:z.string().trim().min(2).max(80),
 domain:z.string().max(200).refine(v=>{try{const u=new URL(v);return secureClinicLink(v)&&u.pathname==='/'&&!u.search&&!u.hash;}catch{return false;}},'Use a secure website origin.'),
 accent:z.enum(['mint','blue','rose']),bookingUrl:optionalLink,registryUrl:optionalLink,location:z.string().trim().max(120).default(''),
});
export type ClinicConfig=z.infer<typeof clinicConfigSchema>;
