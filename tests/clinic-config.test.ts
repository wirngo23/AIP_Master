import test from 'node:test';
import assert from 'node:assert/strict';
import { clinicConfigSchema,secureClinicLink } from '../lib/aip/clinic-config.ts';
test('clinic links permit real HTTPS booking paths and reject script and credential URLs',()=>{
 assert.ok(secureClinicLink('https://clinic.example/book?service=consultation'));for(const link of ['javascript:alert(1)','http://clinic.example','https://user:pass@clinic.example','https://localhost'])assert.equal(secureClinicLink(link),false);
 const clinic=clinicConfigSchema.parse({name:'Test clinic',domain:'https://clinic.example',accent:'mint'});assert.equal(clinic.bookingUrl,'');assert.equal(clinic.registryUrl,'');
 assert.equal(clinicConfigSchema.safeParse({...clinic,domain:'https://clinic.example/?private=1'}).success,false);
});
