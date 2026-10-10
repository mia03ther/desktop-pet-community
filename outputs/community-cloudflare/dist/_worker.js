var Ze=["idle","thinking","working","editing","running","testing","waiting","waving","success","error","celebrating"],ye=new Set(["$schema","manifestVersion","id","name","description","version","runtime","icon","permissions","configSchema","triggers"]),oe=new Set(["$schema","manifestVersion","id","name","description","version","runtime","sdkVersion","entry","icon","permissions","network","configSchema"]),Ae=new Set([...oe,"assets","panels"]),Ve=new Set(["type","label","description","default","options","presentation","min","max","step","maxLength","maxItems","itemSchema"]),Ge=new Set(["label","value","previewSprite"]),Je=new Set(["on","everyMinutes","actions"]),Ke=new Set(["type","message"]),Qe=new Set(["type","reaction"]),Xe=new Set(["text","textarea","number","boolean","select","time","date","multiSelect","list","secret","sound"]),et=new Set(["multi-select","schedule","connection"]),tt=new Set(["dynamicOptions"]),ut=new Set(["plugin","bell","timer","github","heart","sparkles","coffee","focus","droplet"]),Be=["pet:interact","pet:pin","pet:animate","pet:speak:dynamic","pet:drop","pets:read","pets:manage","audio","events","ui:toast","ui:panel","ui:delivery","ui:session","notify","bus","ai","secrets","voice:speak","voice:listen","auth","files","system:openExternal","system:metrics","clipboard","network:write","network:local"],at=["pet:speak","pet:reaction","pet:move","timer","schedule","storage","status","commands","network",...Be],De=["pet:speak","pet:reaction","pet:move","schedule","storage","status","commands","network"],it=[...De,...Be],st=new Set(at),nt=new Set(["pet:speak","pet:reaction","timer"]),be=["icons","images","svgs","sprites","sounds"],ke={icons:[".png",".webp",".svg"],images:[".png",".webp",".jpg",".jpeg",".gif"],svgs:[".svg"],sprites:[".webp"],sounds:[".ogg",".mp3",".wav"]},ot={icons:256*1024,images:1024*1024,svgs:256*1024,sprites:5*1024*1024,sounds:1024*1024},rt=1024*1024,re=/^[a-z0-9][a-z0-9._-]{0,63}$/;function ge(e){let t=[];if(!x(e))return{ok:!1,errors:[{path:"$",code:"invalid_manifest",message:"Plugin manifest must be a JSON object."}]};if(e.manifestVersion===2||e.manifestVersion===3)return ct(e,e.manifestVersion);P(e,ye,"$",t),e.manifestVersion!==1&&p(t,"$.manifestVersion","invalid_manifest_version","manifestVersion must be 1, 2, or 3."),$(e.id,"$.id","id",t,/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/),$(e.name,"$.name","name",t),e.description!==void 0&&$(e.description,"$.description","description",t),$(e.version,"$.version","version",t,/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/),xe(e.icon,t),e.runtime==="javascript"?p(t,"$.runtime","unsupported_runtime",'Runtime "javascript" is recognized but unsupported in manifest v1. Use "declarative".'):e.runtime!=="declarative"&&p(t,"$.runtime","invalid_runtime",'runtime must be "declarative".');let u=ve(e.permissions,t,nt),a=ce(e.configSchema,t);return At(e.triggers,u,a,t),t.length>0?{ok:!1,errors:t}:{ok:!0,manifest:e,errors:[]}}function lt(e){if(!x(e))return ge(e);let t=e.manifestVersion===3?Ae:e.manifestVersion===2?oe:ye;return ge(Object.fromEntries(Object.entries(e).filter(([u])=>t.has(u))))}function ct(e,t){let u=[];return P(e,t===3?Ae:oe,"$",u),$(e.id,"$.id","id",u,/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/),$(e.name,"$.name","name",u),e.description!==void 0&&$(e.description,"$.description","description",u),$(e.version,"$.version","version",u,/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/),xe(e.icon,u),e.runtime!=="javascript"&&p(u,"$.runtime","invalid_runtime",`manifestVersion ${t} runtime must be "javascript".`),$(e.sdkVersion,"$.sdkVersion","sdkVersion",u,/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/),t===3&&typeof e.sdkVersion=="string"&&!e.sdkVersion.startsWith("3.")&&p(u,"$.sdkVersion","invalid_sdk_version","manifestVersion 3 requires sdkVersion 3.x.y."),ft(e.entry,u),pt(e.permissions,t,u),ce(e.configSchema,u,t),Ft(e.network,e.permissions,u),t===3&&(mt(e.assets,u),dt(e.configSchema,e.assets,u),gt(e.panels,u)),u.length>0?{ok:!1,errors:u}:{ok:!0,manifest:e,errors:[]}}function dt(e,t,u){if(!(!x(e)||!x(t)||!x(t.sprites))){for(let[a,i]of Object.entries(e))if(!(!x(i)||i.presentation!=="sprite-grid"||!Array.isArray(i.options)))for(let[n,s]of i.options.entries())(!x(s)||typeof s.previewSprite!="string"||!Object.prototype.hasOwnProperty.call(t.sprites,s.previewSprite))&&p(u,`$.configSchema.${a}.options[${n}].previewSprite`,"invalid_preview_sprite","sprite-grid options must reference a declared sprite.")}}function pt(e,t,u){let a=new Set(t===3?it:De),i=ve(e,u);for(let n of i)a.has(n)||p(u,"$.permissions","invalid_permission",`Permission ${n} is not valid for manifestVersion ${t} javascript plugins.`);return i}function le(e,t,u,a){if(typeof e!="string"||e.trim()==="")return p(a,u,"invalid_asset_path","Asset path must be a non-empty string.");if(e.startsWith("/")||e.includes("\\")||e.split("/").includes("..")||e.split("/").includes("."))return p(a,u,"invalid_asset_path","Asset path must be a safe relative path.");t.some(i=>e.toLowerCase().endsWith(i))||p(a,u,"invalid_asset_format",`Asset must end with one of ${t.join(", ")}.`)}function mt(e,t){if(e!==void 0){if(!x(e))return p(t,"$.assets","invalid_assets","assets must be an object.");P(e,new Set(be),"$.assets",t);for(let u of be){let a=e[u];if(a===void 0)continue;if(!x(a)){p(t,`$.assets.${u}`,"invalid_assets",`assets.${u} must be an object.`);continue}let i=Object.entries(a);i.length>64&&p(t,`$.assets.${u}`,"too_many_assets",`assets.${u} may declare at most 64 entries.`);for(let[n,s]of i){let o=`$.assets.${u}.${n}`;re.test(n)||p(t,o,"invalid_asset_name","Asset names must be simple lowercase identifiers."),u!=="sprites"?le(s,ke[u],o,t):bt(s,o,t)}}}}function bt(e,t,u){if(!x(e)){p(u,t,"invalid_sprite","Sprite assets must declare path and frame metadata.");return}P(e,new Set(["path","frameWidth","frameHeight","frames","durationMs"]),t,u),le(e.path,ke.sprites,`${t}.path`,u);for(let[a,i,n]of[["frameWidth",32,512],["frameHeight",32,512],["frames",1,16],["durationMs",100,4e3]])(typeof e[a]!="number"||!Number.isInteger(e[a])||e[a]<i||e[a]>n)&&p(u,`${t}.${a}`,"invalid_sprite_metadata",`${a} must be an integer between ${i} and ${n}.`)}function gt(e,t){if(e===void 0)return;if(!x(e))return p(t,"$.panels","invalid_panels","panels must be an object.");let u=Object.entries(e);u.length>8&&p(t,"$.panels","too_many_panels","panels may declare at most 8 entries.");for(let[a,i]of u){let n=`$.panels.${a}`;re.test(a)||p(t,n,"invalid_panel_name","Panel names must be simple lowercase identifiers."),le(i,[".html"],n,t)}}function xe(e,t){e!==void 0&&(typeof e!="string"||!ut.has(e))&&p(t,"$.icon","invalid_icon","icon must be one of plugin, bell, timer, github, heart, sparkles, coffee, focus, or droplet.")}function ft(e,t){$(e,"$.entry","entry",t),typeof e=="string"&&(e.startsWith("/")||e.includes("\\")||e.split("/").includes("..")||!/\.(?:mjs|js)$/.test(e))&&p(t,"$.entry","invalid_entry","entry must be a relative .js or .mjs path.")}function ht(e){let t=e.toLowerCase();if(t==="localhost"||t.endsWith(".localhost"))return!0;let u=t.split(".");if(u.length!==4)return!1;let a=u.map(s=>/^\d{1,3}$/.test(s)?Number(s):NaN);if(a.some(s=>!Number.isInteger(s)||s<0||s>255))return!1;let[i,n]=a;return i===10||i===127||i===0||i===169&&n===254||i===172&&n>=16&&n<=31||i===192&&n===168||i===100&&n>=64&&n<=127}function Ft(e,t,u){if(e===void 0)return;if(!x(e)||!Array.isArray(e.hosts))return p(u,"$.network.hosts","invalid_network_hosts","network.hosts must be an array.");P(e,new Set(["hosts"]),"$.network",u);let a=Array.isArray(t)&&t.includes("network:local"),i=new Set;e.hosts.forEach((n,s)=>{let o=typeof n=="string"?n.split(":")[0]:"",r=typeof n=="string"&&ht(o);typeof n!="string"||!/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(n)||n.includes("*")||n.trim()!==n?p(u,`$.network.hosts[${s}]`,"invalid_network_host","network hosts must be exact host names."):["169.254.169.254","metadata.google.internal","169.254.170.2","fd00:ec2::254"].includes(n.toLowerCase())?p(u,`$.network.hosts[${s}]`,"blocked_host","This host is unconditionally blocked for security reasons."):r&&!a?p(u,`$.network.hosts[${s}]`,"missing_local_network_permission",'Local/private network hosts require the "network:local" permission.'):r&&!/:\d{1,5}$/.test(n)?p(u,`$.network.hosts[${s}]`,"missing_port","network:local hosts must include a port (e.g. '127.0.0.1:8765')."):i.has(n)&&p(u,`$.network.hosts[${s}]`,"duplicate_network_host","Duplicate network host."),i.add(String(n))})}function ve(e,t,u=st){let a=new Set;return Array.isArray(e)?(e.forEach((i,n)=>{if(typeof i!="string"||!u.has(i)){p(t,`$.permissions[${n}]`,"invalid_permission",`Permission must be one of ${[...u].join(", ")}.`);return}if(a.has(i)){p(t,`$.permissions[${n}]`,"duplicate_permission",`Duplicate permission ${i}.`);return}a.add(i)}),a):(p(t,"$.permissions","invalid_permissions","permissions must be an array."),a)}function ce(e,t,u=1){let a={text:new Set,select:new Set,number:new Set,schema:x(e)?e:{}};if(e===void 0)return a;if(!x(e))return p(t,"$.configSchema","invalid_config_schema","configSchema must be an object."),a;let i=new Set(["date","secret","sound"]);for(let[n,s]of Object.entries(e)){let o=`$.configSchema.${n}`;if(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(n)||p(t,o,"invalid_config_key","Config field keys must be simple identifiers."),!x(s)){p(t,o,"invalid_config_field","Config field must be an object.");continue}P(s,Ve,o,t);for(let r of tt)Object.prototype.hasOwnProperty.call(s,r)&&p(t,`${o}.${r}`,"deferred_config_feature",`${r} is deferred and unsupported in v1.`);if(typeof s.type!="string"||!Xe.has(s.type)||u<3&&i.has(s.type)){let r=typeof s.type=="string"&&(et.has(s.type)||u<3&&i.has(s.type))?"deferred_config_type":"invalid_config_type";p(t,`${o}.type`,r,"Config field type is not supported for this manifest version.")}else Et(s,o,t,u),s.type==="number"&&a.number.add(n),s.type==="text"&&a.text.add(n),s.type==="select"&&a.select.add(n)}return a}function Et(e,t,u,a=1){e.label!==void 0&&$(e.label,`${t}.label`,"label",u),e.description!==void 0&&$(e.description,`${t}.description`,"description",u),e.type!=="select"&&e.type!=="multiSelect"&&e.options!==void 0&&p(u,`${t}.options`,"invalid_options","options are only valid for select config fields."),(e.type==="text"||e.type==="textarea")&&e.default!==void 0&&typeof e.default!="string"&&p(u,`${t}.default`,"invalid_default","Default must be a string."),e.type==="number"&&e.default!==void 0&&(typeof e.default!="number"||!Number.isFinite(e.default))&&p(u,`${t}.default`,"invalid_default","Default must be a finite number."),e.type==="boolean"&&e.default!==void 0&&typeof e.default!="boolean"&&p(u,`${t}.default`,"invalid_default","Default must be a boolean."),e.type==="time"&&e.default!==void 0&&(typeof e.default!="string"||!Ct(e.default))&&p(u,`${t}.default`,"invalid_default","Default must be HH:mm between 00:00 and 23:59."),e.type==="date"&&e.default!==void 0&&(typeof e.default!="string"||!/^\d{4}-\d{2}-\d{2}$/.test(e.default))&&p(u,`${t}.default`,"invalid_default","Default must be YYYY-MM-DD."),e.type==="secret"&&e.default!==void 0&&p(u,`${t}.default`,"invalid_default","Secret config fields must not declare defaults."),e.presentation!==void 0&&(e.type!=="select"||e.presentation!=="sprite-grid")&&p(u,`${t}.presentation`,"invalid_presentation","sprite-grid presentation is only valid for select fields."),(e.type==="select"||e.type==="multiSelect")&&wt(e,t,u),e.type==="list"&&(e.maxItems!==void 0&&(typeof e.maxItems!="number"||!Number.isInteger(e.maxItems)||e.maxItems<0)&&p(u,`${t}.maxItems`,"invalid_max_items","maxItems must be a non-negative integer."),e.itemSchema!==void 0&&ce(e.itemSchema,u,a))}function Ct(e){let t=/^(\d{2}):(\d{2})$/.exec(e);return!!t&&Number(t[1])<=23&&Number(t[2])<=59}function wt(e,t,u){if(!Array.isArray(e.options)||e.options.length===0){p(u,`${t}.options`,"invalid_options","select config fields must have non-empty options.");return}let a=yt(e.options,t,u);e.default!==void 0&&(e.type==="multiSelect"?(!Array.isArray(e.default)||e.default.some(i=>typeof i!="string"||!a.has(i)))&&p(u,`${t}.default`,"invalid_default","Multi-select default must match option values."):typeof e.default!="string"?p(u,`${t}.default`,"invalid_default","Select default must be a string."):a.has(e.default)||p(u,`${t}.default`,"invalid_default","Select default must match one of the option values."))}function yt(e,t,u){let a=new Set;return Array.isArray(e)?(e.forEach((i,n)=>{let s=`${t}.options[${n}]`;if(!x(i))return p(u,s,"invalid_option","Option must be an object.");P(i,Ge,s,u),$(i.label,`${s}.label`,"option label",u),$(i.value,`${s}.value`,"option value",u),i.previewSprite!==void 0&&(typeof i.previewSprite!="string"||!re.test(i.previewSprite))&&p(u,`${s}.previewSprite`,"invalid_preview_sprite","previewSprite must be a declared sprite name."),typeof i.value=="string"&&i.value.trim()!==""&&(a.has(i.value)&&p(u,`${s}.value`,"duplicate_option_value",`Duplicate option value ${i.value}.`),a.add(i.value))}),a):(p(u,`${t}.options`,"invalid_options","options must be an array."),a)}function At(e,t,u,a){if(!Array.isArray(e))return p(a,"$.triggers","invalid_triggers","triggers must be an array.");e.forEach((i,n)=>{let s=`$.triggers[${n}]`;if(!x(i))return p(a,s,"invalid_trigger","Trigger must be an object.");if(P(i,Je,s,a),i.on!=="timer"&&p(a,`${s}.on`,"invalid_trigger","Only timer triggers are supported in v1."),ie(t,"timer",s,a),Bt(i.everyMinutes,u.number,`${s}.everyMinutes`,a),!Array.isArray(i.actions))return p(a,`${s}.actions`,"invalid_actions","actions must be an array.");i.actions.forEach((o,r)=>kt(o,t,u,`${s}.actions[${r}]`,a))})}function Bt(e,t,u,a){if(typeof e=="number"){(!Number.isInteger(e)||e<5)&&p(a,u,"invalid_timer_interval","Timer interval must be an integer of at least 5 minutes.");return}if(!x(e)||Object.keys(e).length!==1||!Object.prototype.hasOwnProperty.call(e,"config")||typeof e.config!="string"){p(a,u,"invalid_timer_interval","Timer interval must be an integer or { config: string }.");return}t.has(e.config)||p(a,`${u}.config`,"invalid_timer_config_reference","Timer config reference must point to a number config field.")}function fe(e,t,u,a,i,n){if(typeof e=="string")return $(e,u,a,n);if(!x(e)||Object.keys(e).length!==1||!Object.prototype.hasOwnProperty.call(e,"config")||typeof e.config!="string"){p(n,u,"invalid_config_reference",`${a} must be a non-empty string or { config: string }.`);return}t.has(e.config)||p(n,`${u}.config`,"invalid_config_reference",`${a} config reference must point to a ${i} config field.`)}function Dt(e,t,u,a){if(!Object.prototype.hasOwnProperty.call(e,t))return;let i=e[t];if(!x(i)||i.type!=="select")return;let n=new Set(Ze);if((!Object.prototype.hasOwnProperty.call(i,"default")||typeof i.default!="string"||!n.has(i.default))&&p(a,`${u}.config`,"invalid_reaction_config_reference","Reaction select config must have a valid OpenPets reaction default."),Array.isArray(i.options))for(let s of i.options)x(s)&&typeof s.value=="string"&&!n.has(s.value)&&p(a,`${u}.config`,"invalid_reaction_config_reference","Reaction select options must be valid OpenPets reactions.")}function kt(e,t,u,a,i){if(!x(e))return p(i,a,"invalid_action","Action must be an object.");e.type==="pet.speak"?(P(e,Ke,a,i),fe(e.message,u.text,`${a}.message`,"message","text",i),ie(t,"pet:speak",a,i)):e.type==="pet.react"?(P(e,Qe,a,i),fe(e.reaction,u.select,`${a}.reaction`,"reaction","select",i),x(e.reaction)&&typeof e.reaction.config=="string"&&u.select.has(e.reaction.config)&&Dt(u.schema,e.reaction.config,`${a}.reaction`,i),ie(t,"pet:reaction",a,i)):p(i,`${a}.type`,"invalid_action","Action type must be pet.speak or pet.react.")}function ie(e,t,u,a){e.has(t)||p(a,u,"missing_permission",`Missing required permission ${t}.`)}function P(e,t,u,a){for(let i of Object.keys(e))t.has(i)||p(a,`${u}.${i}`,"unknown_field",`Unknown field ${i}.`)}function $(e,t,u,a,i){if(typeof e!="string"||e.trim()==="")return p(a,t,"invalid_string",`${u} must be a non-empty string.`);i&&!i.test(e)&&p(a,t,"invalid_format",`${u} has an invalid format.`)}function p(e,t,u,a){e.push({path:t,code:u,message:a})}function x(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}var Se=["idle","running-right","running-left","waving","jumping","failed","waiting","running","review"],Ne=["sleeping","clicked","dragged"];function xt(e){return typeof e=="string"&&e.length<=240&&/\.(?:mp4|webm|webp)$/i.test(e)&&e.split("/").every(t=>/^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,79}$/u.test(t)&&!/[. ]$/.test(t)&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(t))}function vt(e){return typeof e=="string"&&/^[a-z0-9][a-z0-9_-]{0,63}$/.test(e)&&!["__proto__","constructor","prototype"].includes(e)}function St(e,t){if(!Y(e)||e.mediaVersion!==1)throw new Error("\u52A8\u4F5C\u5A92\u4F53\u5305\u7684 mediaVersion \u5FC5\u987B\u4E3A 1\u3002");if(!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(t)||t==="builtin"||e.id!==t)throw new Error("\u684C\u5BA0\u7F16\u53F7\u65E0\u6548\u6216\u4E0E\u7D20\u6750\u5305\u4E0D\u4E00\u81F4\u3002");if(typeof e.displayName!="string"||!e.displayName.trim()||e.displayName.length>80)throw new Error("\u684C\u5BA0\u540D\u79F0\u65E0\u6548\u3002");if(typeof e.description!="string"||!e.description.trim()||e.description.length>500)throw new Error("\u684C\u5BA0\u63CF\u8FF0\u65E0\u6548\u3002");if(!Y(e.actions)||!Object.hasOwn(e.actions,"idle")||Object.keys(e.actions).length>128)throw new Error("\u52A8\u4F5C\u5A92\u4F53\u5305\u9700\u8981 idle \u5F85\u673A\u52A8\u4F5C\uFF0C\u6700\u591A\u652F\u6301 128 \u4E2A\u52A8\u4F5C\u3002");let u={};for(let[s,o]of Object.entries(e.actions)){if(!vt(s)||!xt(o))throw new Error(`\u52A8\u4F5C ${s} \u9700\u8981\u6709\u6548\u7F16\u53F7\u53CA\u672C\u5305\u5185\u7684 MP4\u3001WebM \u6216 WebP \u6587\u4EF6\u3002`);u[s]=o}let a={};if(e.actionDefinitions!==void 0){if(!Y(e.actionDefinitions))throw new Error("\u52A8\u4F5C\u540D\u79F0\u4E0E\u5206\u7C7B\u65E0\u6548\u3002");for(let[s,o]of Object.entries(e.actionDefinitions)){if(!Object.hasOwn(u,s)||!Y(o)||typeof o.displayName!="string"||!o.displayName.trim()||o.displayName.length>80||o.category!==void 0&&(typeof o.category!="string"||!o.category.trim()||o.category.length>80))throw new Error("\u52A8\u4F5C\u540D\u79F0\u4E0E\u5206\u7C7B\u5FC5\u987B\u5BF9\u5E94\u5DF2\u6709\u52A8\u4F5C\uFF0C\u4E14\u4E0D\u8D85\u8FC7 80 \u5B57\u3002");a[s]={...o,displayName:o.displayName.trim(),...typeof o.category=="string"?{category:o.category.trim()}:{}}}}let i={};if(e.stateBindings!==void 0){if(!Y(e.stateBindings))throw new Error("\u72B6\u6001\u52A8\u4F5C\u7ED1\u5B9A\u65E0\u6548\u3002");for(let[s,o]of Object.entries(e.stateBindings)){if(![...Se,...Ne].includes(s)||typeof o!="string"||!Object.hasOwn(u,o))throw new Error("\u72B6\u6001\u7ED1\u5B9A\u5FC5\u987B\u5F15\u7528\u5DF2\u58F0\u660E\u7684\u52A8\u4F5C\u3002");i[s]=o}}if(e.staticActions!==void 0&&(!Array.isArray(e.staticActions)||e.staticActions.some(s=>typeof s!="string"||!Object.hasOwn(u,s))))throw new Error("\u9759\u6001\u52A8\u4F5C\u5FC5\u987B\u5F15\u7528\u5DF2\u58F0\u660E\u52A8\u4F5C\u3002");if(!Y(e.background)||e.background.mode!=="alpha"&&e.background.mode!=="chroma")throw new Error("\u8BF7\u9009\u62E9\u900F\u660E\u901A\u9053\u6216\u7EAF\u8272\u53BB\u80CC\u3002");let n;if(e.background.mode==="chroma"){let{color:s,tolerance:o}=e.background;if(typeof s!="string"||!/^#[0-9a-f]{6}$/i.test(s))throw new Error("\u7EAF\u8272\u53BB\u80CC\u9700\u8981\u516D\u4F4D\u80CC\u666F\u989C\u8272\u3002");if(o!==void 0&&(!Number.isInteger(o)||o<10||o>160))throw new Error("\u53BB\u80CC\u5BB9\u5DEE\u5FC5\u987B\u4E3A 10 \u81F3 160\u3002");n={...e.background,mode:"chroma",color:s.toLowerCase(),tolerance:typeof o=="number"?o:70}}else{if(Object.values(u).some(s=>s.toLowerCase().endsWith(".mp4")))throw new Error("MP4 \u4E0D\u542B\u900F\u660E\u901A\u9053\uFF0C\u8BF7\u4F7F\u7528\u4E0D\u4E0E\u89D2\u8272\u914D\u8272\u51B2\u7A81\u7684\u7EAF\u8272\u80CC\u666F\u5E76\u58F0\u660E\u53BB\u80CC\u989C\u8272\u3002");n={...e.background,mode:"alpha"}}return{...e,id:t,displayName:e.displayName.trim(),description:e.description.trim(),mediaVersion:1,actions:u,background:n,...e.actionDefinitions!==void 0?{actionDefinitions:a}:{},...e.stateBindings!==void 0?{stateBindings:i}:{},...Array.isArray(e.staticActions)?{staticActions:e.staticActions}:{}}}function Y(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}var cu=128*1024,du=100*1024*1024,pu=24*1024*1024,Nt={version:1,frameWidth:192,frameHeight:208,columns:8,rows:9},Lt={version:2,frameWidth:192,frameHeight:208,columns:8,rows:11,neutralPose:{row:0,column:6}},Tt=16,mu=Math.PI*2/Tt;function It(e,t){if(!he(t))throw new Error("Codex pet folder name is invalid.");if(!Le(e))throw new Error("pet.json must be an object.");let u=zt(e);if(e.id!==t||typeof e.id!="string")throw new Error("Codex pet id must match its folder name.");if(!he(e.id))throw new Error("Codex pet id is invalid.");let a=Object.hasOwn(e,"displayName")?e.displayName:e.name;if(typeof a!="string"||a.trim().length===0||a.length>80)throw new Error("Codex pet displayName is invalid.");if(typeof e.description!="string"||e.description.trim().length===0||e.description.length>500)throw new Error("Codex pet description is invalid.");if(e.spritesheetPath!=="spritesheet.webp")throw new Error("Codex pet spritesheetPath must be spritesheet.webp.");return{id:e.id,displayName:a.trim(),description:e.description.trim(),spritesheetPath:"spritesheet.webp",...u.version===2?{spriteVersionNumber:2}:{}}}function zt(e){if(!Le(e)||!Object.hasOwn(e,"spriteVersionNumber")||e.spriteVersionNumber===1)return Nt;if(e.spriteVersionNumber===2)return Lt;throw new Error("\u684C\u5BA0 spriteVersionNumber \u5FC5\u987B\u662F\u6570\u5B57 1 \u6216 2\u3002")}function he(e){return/^[a-z0-9][a-z0-9_-]{0,63}$/.test(e)&&e!=="builtin"}function Le(e){return typeof e=="object"&&e!==null}var K=new TextEncoder,$t=/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i,bu=[...Se,...Ne];function ee(e,t,u,a=!0){if(typeof e!="string"||e.length>u||/[\p{Cc}\p{Cf}\u2028\u2029]/u.test(e))throw new Error(`${t}\u683C\u5F0F\u65E0\u6548\u6216\u8D85\u8FC7 ${u} \u5B57\u3002`);let i=e.trim();if(a&&!i)throw new Error(`\u8BF7\u586B\u5199${t}\u3002`);return i}function Te(e){return{author:ee(e.author,"\u4F5C\u8005",120),source:ee(e.source??"","\u6765\u6E90",1e3,!1),license:ee(e.license,"\u8BB8\u53EF\u58F0\u660E",200)}}function jt(e,t,u){let a=`# ${e}

\u4F5C\u8005\uFF1A${t.author}
\u6765\u6E90\uFF1A${t.source}
\u8BB8\u53EF\u58F0\u660E\uFF1A${t.license}

\u4EE5\u4E0A\u4E3A\u586B\u5199\u8005\u58F0\u660E\uFF0C\u672A\u7ECF\u5E73\u53F0\u6838\u5B9E\u3002

${u==="pet"?"\u5728\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u300C\u6211\u7684\u684C\u5BA0\u300D\u5BFC\u5165 ZIP\u3002":"\u5728\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u300C\u63D2\u4EF6\u7BA1\u7406\u300D\u5BFC\u5165 ZIP \u6216\u6587\u4EF6\u5939\uFF0C\u786E\u8BA4\u6743\u9650\u540E\u542F\u7528\u3002\u5176\u4ED6\u5BBF\u4E3B\u63D2\u4EF6\u9700\u8981\u9002\u914D\u540E\u624D\u80FD\u8FD0\u884C\u3002"}

\u672C\u5305\u4FDD\u7559\u4E0A\u4F20\u7684\u4F5C\u54C1\u6587\u4EF6\u3002\u5206\u4EAB\u524D\u786E\u8BA4\u5176\u4E2D\u6CA1\u6709\u5BC6\u94A5\u3001\u79C1\u4EBA\u914D\u7F6E\u6216\u804A\u5929\u8BB0\u5F55\u3002\u8BF7\u4FDD\u7559\u539F\u5305\u3001\u4F5C\u8005\u58F0\u660E\u548C\u8BB8\u53EF\u8BC1\u3002
`;if(K.encode(a).length>16*1024)throw new Error("\u5206\u4EAB\u8BF4\u660E\u8FC7\u5927\u3002");return a}function Ht(e){let t=4294967295;for(let u of e){t^=u;for(let a=0;a<8;a++)t=t>>>1^(t&1?3988292384:0)}return(t^4294967295)>>>0}function q(e){if(typeof e!="string"||e.length>240||!e||e.split("/").length>13||/[\\:<>"|?*\p{Cc}\p{Cf}]/u.test(e)||e.startsWith("/")||e.split("/").some(t=>!t||t==="."||t===".."||/[. ]$/.test(t)||$t.test(t)))throw new Error("\u6587\u4EF6\u8DEF\u5F84\u65E0\u6548\uFF1A\u8BF7\u4F7F\u7528\u4E0D\u542B\u4E0A\u7EA7\u76EE\u5F55\u3001\u7EDD\u5BF9\u5730\u5740\u6216\u7CFB\u7EDF\u4FDD\u7559\u540D\u7684\u5305\u5185\u8DEF\u5F84\u3002");return e}async function Ie(e,t,{maxTotalBytes:u=200*1024*1024,maxFileBytes:a=100*1024*1024}={}){let i=e instanceof Uint8Array?e:new Uint8Array(e);if(i.length>200*1024*1024)throw new Error("ZIP \u8D85\u8FC7 200 MB\uFF0C\u8BF7\u5206\u5F00\u6574\u7406\u7D20\u6750\u3002");let n=new DataView(i.buffer,i.byteOffset,i.byteLength),s=-1;for(let d=i.length-22;d>=Math.max(0,i.length-65557);d--)if(n.getUint32(d,!0)===101010256&&d+22+n.getUint16(d+20,!0)===i.length){s=d;break}if(s<0)throw new Error("ZIP \u76EE\u5F55\u635F\u574F\u6216\u4E0D\u662F\u53D7\u652F\u6301\u7684 ZIP\u3002");let o=n.getUint16(s+10,!0);if(n.getUint16(s+4,!0)||n.getUint16(s+6,!0)||o!==n.getUint16(s+8,!0)||o>1e3)throw new Error("\u4E0D\u652F\u6301\u5206\u5377 ZIP\uFF0C\u6216\u6587\u4EF6\u6570\u91CF\u8D85\u8FC7 1000\u3002");let r=Object.create(null),c=new Set,l=n.getUint32(s+16,!0),b=0;for(let d=0;d<o;d++){if(l+46>s||n.getUint32(l,!0)!==33639248)throw new Error("ZIP \u6587\u4EF6\u76EE\u5F55\u635F\u574F\u3002");let g=n.getUint16(l+8,!0),h=n.getUint16(l+10,!0),z=n.getUint32(l+20,!0),j=n.getUint32(l+24,!0),m=n.getUint16(l+28,!0),y=l+46+m+n.getUint16(l+30,!0)+n.getUint16(l+32,!0);if(y>s||g&1||![0,8].includes(h)||(n.getUint32(l+38,!0)>>>16&61440)===40960)throw new Error("ZIP \u5305\u542B\u52A0\u5BC6\u6587\u4EF6\u3001\u94FE\u63A5\u6216\u4E0D\u652F\u6301\u7684\u538B\u7F29\u65B9\u5F0F\u3002");let E=new TextDecoder("utf-8",{fatal:!0}).decode(i.subarray(l+46,l+46+m)),D=E.endsWith("/");q(D?E.slice(0,-1):E);let N=E.toLocaleLowerCase();if(c.has(N))throw new Error("ZIP \u5305\u542B\u91CD\u540D\u6587\u4EF6\u3002");if(c.add(N),!D){if(b+=j,j>a||b>u)throw new Error("ZIP \u5185\u6587\u4EF6\u5927\u5C0F\u6216\u603B\u91CF\u8D85\u8FC7\u8BFB\u53D6\u9650\u5236\u3002");let v=n.getUint32(l+42,!0);if(v+30>l||n.getUint32(v,!0)!==67324752)throw new Error("ZIP \u6587\u4EF6\u5934\u635F\u574F\u3002");let w=v+30+n.getUint16(v+26,!0)+n.getUint16(v+28,!0);if(w+z>l)throw new Error("ZIP \u6587\u4EF6\u6570\u636E\u8D8A\u754C\u3002");let I=i.subarray(w,w+z),S=h===0?I.slice():await t(I,j);if(S.length!==j||Ht(S)!==n.getUint32(l+16,!0))throw new Error("ZIP \u6587\u4EF6\u6821\u9A8C\u5931\u8D25\u3002");r[E]=S}l=y}return r}function Pt(e,t){let u=[],a=o=>o!==null&&typeof o=="object"&&!Array.isArray(o);if(e.assets!==void 0){if(!a(e.assets))throw new Error("\u63D2\u4EF6 assets \u9700\u8981\u6309\u7D20\u6750\u79CD\u7C7B\u58F0\u660E\u6587\u4EF6\u3002");for(let[o,r]of Object.entries(e.assets)){if(!["icons","images","svgs","sprites","sounds"].includes(o)||!a(r))throw new Error("\u63D2\u4EF6\u7D20\u6750\u79CD\u7C7B\u6216\u6587\u4EF6\u58F0\u660E\u65E0\u6548\u3002");for(let c of Object.values(r)){let l=o==="sprites"&&a(c)?c.path:c;if(q(l),t[l]?.length>ot[o])throw new Error(`\u63D2\u4EF6 ${o} \u9644\u4EF6\u8D85\u8FC7\u5927\u5C0F\u4E0A\u9650\uFF1A${l}\u3002`);u.push(l)}}}if(e.panels!==void 0){if(!a(e.panels))throw new Error("\u63D2\u4EF6 panels \u9700\u8981\u58F0\u660E\u5BF9\u5E94\u9875\u9762\u6587\u4EF6\u3002");for(let o of Object.values(e.panels)){if(q(o),t[o]?.length>rt)throw new Error(`\u63D2\u4EF6\u9762\u677F\u8D85\u8FC7 1 MB\uFF1A${o}\u3002`);u.push(o)}}let i=new Set,n=[e.name,e.description,e.configSchema,e.triggers];for(;n.length;){let o=n.pop();typeof o=="string"&&o.startsWith("$t:")?i.add(o.slice(3)):o!==null&&typeof o=="object"&&n.push(...Object.values(o))}let s=new Map;for(let o of Object.keys(t).filter(r=>/^locales\/[^/]+\.json$/.test(r))){if(q(o),t[o].length>256*1024)throw new Error(`\u7FFB\u8BD1\u9644\u4EF6\u8D85\u8FC7 256 KB\uFF1A${o}\u3002`);let r;try{r=JSON.parse(new TextDecoder().decode(t[o]))}catch{throw new Error(`\u7FFB\u8BD1\u9644\u4EF6\u4E0D\u662F\u6709\u6548 JSON\uFF1A${o}\u3002`)}if(!a(r)||Object.values(r).some(c=>typeof c!="string"))throw new Error(`\u7FFB\u8BD1\u9644\u4EF6\u9700\u8981\u662F\u6587\u5B57\u952E\u503C\u8868\uFF1A${o}\u3002`);s.set(o,r)}if(i.size){u.push("locales/en.json");let o=s.get("locales/en.json");if(o){for(let r of i)if(!Object.hasOwn(o,r))throw new Error(`\u7FFB\u8BD1\u9644\u4EF6 locales/en.json \u7F3A\u5C11\u6587\u5B57\u952E\uFF1A${r}\u3002\u8BF7\u8865\u5145\u5B8C\u6574\u7FFB\u8BD1\u6587\u4EF6\u3002`)}}return u}function Ut(e,t){let a=(t==="pet"?["pet.json","manifest.json","metadata.json"]:["desktop-pet.plugin.json","plugin.json","openpets.plugin.json","manifest.json","package.json"]).find(d=>Object.hasOwn(e,d));if(!a&&t==="pet"&&Object.hasOwn(e,"conf/actions.xml")&&Object.keys(e).some(d=>/^img\/.*\.png$/i.test(d)))return{manifestName:"conf/actions.xml",manifest:{},compatibility:"Shimeji \u56FE\u50CF\u5E8F\u5217 \xB7 \u684C\u9762\u5BFC\u5165\u8F6C\u6362\uFF0CJava \u884C\u4E3A\u9700\u4E13\u7528\u5F15\u64CE",fileCount:Object.keys(e).length,bytes:Object.values(e).reduce((d,g)=>d+g.length,0)};if(!a)return{manifestName:null,manifest:{},workInfo:{},compatibility:`${t==="pet"?"\u81EA\u5B9A\u4E49\u684C\u5BA0\u7D20\u6750":"\u672A\u8BC6\u522B\u5BBF\u4E3B\u63D2\u4EF6"} \xB7 \u4EC5\u5F52\u6863\u5206\u4EAB\uFF0C\u8FD0\u884C\u9700\u9002\u914D`,fileCount:Object.keys(e).length,bytes:Object.values(e).reduce((d,g)=>d+g.length,0)};if(e[a].length>1024*1024)throw new Error("\u6E05\u5355\u8D85\u8FC7 1 MB\u3002");let i;try{i=JSON.parse(new TextDecoder().decode(e[a]))}catch{throw new Error("\u4F5C\u54C1\u6E05\u5355\u4E0D\u662F\u6709\u6548\u7684 JSON\uFF0C\u8BF7\u68C0\u67E5\u540E\u91CD\u65B0\u5BFC\u5165\u3002")}if(!i||typeof i!="object"||Array.isArray(i))throw new Error("\u6E05\u5355\u9700\u8981\u662F JSON \u5BF9\u8C61\u3002");let n=[],s;if(t==="pet")if(i.mediaVersion===1&&i.actions&&typeof i.actions=="object"){if(n.push(...Object.values(i.actions)),!i.actions.idle)throw new Error("\u52A8\u4F5C\u5305\u9700\u8981 idle \u5F85\u673A\u52A8\u4F5C\uFF0C\u5176\u4ED6\u72B6\u6001\u53EF\u7ED1\u5B9A\u4EFB\u610F\u52A8\u4F5C\u3002");s="\u72EC\u7ACB\u52A8\u4F5C\u5305"}else typeof i.spritesheetPath=="string"||Object.hasOwn(e,"spritesheet.webp")?(n.push(i.spritesheetPath||"spritesheet.webp"),s="WebP \u56FE\u96C6\u5305"):s="\u5176\u4ED6\u684C\u5BA0\u683C\u5F0F \xB7 \u53EF\u4FDD\u5B58\u5206\u4EAB\uFF0C\u8FD0\u884C\u9700\u9002\u914D";else{let d=i.runtime==="declarative"&&i.manifestVersion===1||i.runtime==="javascript"&&[2,3].includes(i.manifestVersion);if(s=d?`SDK ${i.manifestVersion} \xB7 ${i.runtime==="javascript"?"JavaScript":"\u58F0\u660E\u5F0F"}`:"\u5176\u4ED6\u5BBF\u4E3B\u63D2\u4EF6 \xB7 \u53EF\u4FDD\u5B58\u5206\u4EAB\uFF0C\u8FD0\u884C\u9700\u9002\u914D",d){if(e[a].length>64*1024)throw new Error("\u63D2\u4EF6\u6E05\u5355\u8D85\u8FC7 64 KB\u3002");let g=lt(i);if(!g.ok)throw new Error(`\u63D2\u4EF6\u6E05\u5355\u5B57\u6BB5\u65E0\u6548\uFF1A${g.errors.map(h=>h.path).join("\u3001")}\u3002`)}if(d&&i.runtime==="javascript"){if(typeof i.entry!="string")throw new Error("JavaScript \u63D2\u4EF6\u9700\u8981\u58F0\u660E\u5165\u53E3\u6587\u4EF6\u3002");if(e[i.entry]?.length>1024*1024)throw new Error("\u63D2\u4EF6\u5165\u53E3\u8D85\u8FC7 1 MB\u3002");n.push(i.entry)}d&&n.push(...Pt(i,e))}for(let d of n)if(q(d),!Object.hasOwn(e,d))throw new Error(`\u7F3A\u5C11\u6E05\u5355\u5F15\u7528\u9644\u4EF6\uFF1A${d}\u3002\u8BF7\u4E0A\u4F20\u5305\u542B\u6B64\u6587\u4EF6\u7684\u5B8C\u6574\u6587\u4EF6\u5939\u6216 ZIP\uFF0C\u6216\u8865\u9009\u5168\u90E8\u914D\u5957\u6587\u4EF6\u3002`);let o={};if(e["submission.json"]?.length<=1024*1024)try{let d=JSON.parse(new TextDecoder().decode(e["submission.json"]));d&&typeof d=="object"&&!Array.isArray(d)&&(o=d)}catch{}function r(d){if(typeof d!="string")return"";if(!d.startsWith("$t:"))return d;for(let g of["locales/zh-Hans.json","locales/zh-CN.json","locales/en.json"])if(!(!e[g]||e[g].length>1024*1024))try{let h=JSON.parse(new TextDecoder().decode(e[g]));if(typeof h?.[d.slice(3)]=="string")return h[d.slice(3)]}catch{}return""}let c={id:r(i.id),title:r(i.displayName||i.title||i.name),description:r(i.description||o.description),author:r(i.author||o.author),source:r(i.sourceUrl||o.source_url),license:r(i.license||o.license)},l=Object.values(e).reduce((d,g)=>d+g.length,0),b=t==="plugin"&&l>32*1024*1024?"\u8D85\u8FC7\u672C\u5730\u63D2\u4EF6 32 MB \u8FD0\u884C\u5BFC\u5165\u4E0A\u9650\uFF1B\u53EF\u5B8C\u6574\u5F52\u6863\u5206\u4EAB\uFF0C\u8FD0\u884C\u524D\u9700\u7CBE\u7B80\u4F5C\u54C1\u6587\u4EF6\u3002":"";return{manifestName:a,manifest:i,workInfo:c,compatibility:s,runtimeWarning:b,fileCount:Object.keys(e).length,bytes:l}}function de(e){if(!(e instanceof Uint8Array)||e.length>10*1024*1024)throw new Error("\u5C01\u9762\u9700\u4E3A 10 MB \u4EE5\u5185\u7684 PNG\u3001JPEG \u6216 WebP \u56FE\u7247\u3002");if(e.length>=8&&[137,80,78,71,13,10,26,10].every((t,u)=>e[u]===t))return{extension:"png",mime:"image/png"};if(e.length>=3&&e[0]===255&&e[1]===216&&e[2]===255)return{extension:"jpg",mime:"image/jpeg"};if(e.length>=12&&new TextDecoder().decode(e.subarray(0,4))==="RIFF"&&new TextDecoder().decode(e.subarray(8,12))==="WEBP")return{extension:"webp",mime:"image/webp"};throw new Error("\u5C01\u9762\u9700\u4E3A PNG\u3001JPEG \u6216 WebP \u56FE\u7247\uFF0C\u4E0D\u652F\u6301 SVG \u6216\u7F51\u9875\u6587\u4EF6\u3002")}function Ot(e){let t=Object.keys(e).filter(u=>/^WORK-INFO(?:-\d+)?\.json$/i.test(u)).sort((u,a)=>Number(a.match(/-(\d+)\.json$/i)?.[1]||1)-Number(u.match(/-(\d+)\.json$/i)?.[1]||1));for(let u of t)if(!(e[u].length>64*1024))try{let a=JSON.parse(new TextDecoder().decode(e[u]));if(a&&typeof a=="object"&&!Array.isArray(a))return a}catch{}return{}}function ze(e,t){let u=t==="pet"?["pet.json","manifest.json","metadata.json","conf/actions.xml"]:["desktop-pet.plugin.json","plugin.json","openpets.plugin.json","manifest.json","package.json"],a=Object.keys(e),i=u.flatMap(f=>a.filter(k=>k===f||k.endsWith(`/${f}`)).sort((k,U)=>k.split("/").length-U.split("/").length)),n=new Set(i.map(f=>f.endsWith("conf/actions.xml")?f.slice(0,-16):f.slice(0,f.length-f.split("/").pop().length))),s=i[0],o=s?.includes("/")?s.slice(0,s.length-(s.endsWith("conf/actions.xml")?16:s.split("/").pop().length)):"",r=Object.fromEntries(Object.entries(e).filter(([f])=>f.startsWith(o)).map(([f,k])=>[f.slice(o.length),k])),c,l;try{c=Ut(r,t)}catch(f){l=f.message,c={manifest:{},workInfo:{},compatibility:"\u6E05\u5355\u6216\u9644\u4EF6\u4E0D\u5B8C\u6574"}}n.size>1&&(l="\u53D1\u73B0\u591A\u4E2A\u4F5C\u54C1\u76EE\u5F55\uFF0C\u8BF7\u5355\u72EC\u9009\u62E9\u9700\u8981\u8FD0\u884C\u7684\u4F5C\u54C1\u5305\uFF1B\u5F53\u524D\u53EA\u4FDD\u7559\u6574\u4E2A\u76EE\u5F55\u5F52\u6863\uFF0C\u4E0D\u81EA\u52A8\u9009\u62E9\u5176\u4E2D\u4E00\u4E2A\u3002");let b=c.manifest;if(!l&&c.compatibility==="\u72EC\u7ACB\u52A8\u4F5C\u5305")try{St(b,b.id)}catch(f){l=f.message}!l&&c.compatibility==="WebP \u56FE\u96C6\u5305"&&b.spriteVersionNumber!==void 0&&![1,2].includes(b.spriteVersionNumber)&&(l="\u672C\u7CFB\u7EDF\u53EA\u652F\u6301 V1 \u6216 V2 WebP \u56FE\u96C6\u7ED3\u6784\u3002"),!l&&/^SDK /.test(c.compatibility)&&(typeof b.id!="string"||!b.id||typeof b.name!="string"||!b.name||typeof b.version!="string"||!b.version||!Array.isArray(b.permissions))&&(l="SDK \u6E05\u5355\u7F3A\u5C11\u6709\u6548\u7684\u7F16\u53F7\u3001\u540D\u79F0\u3001\u7248\u672C\u6216\u6743\u9650\u58F0\u660E\u3002");let d=!l&&(t==="pet"?["\u72EC\u7ACB\u52A8\u4F5C\u5305","WebP \u56FE\u96C6\u5305"].includes(c.compatibility):/^SDK /.test(c.compatibility)),g=!l&&c.compatibility.startsWith("Shimeji"),h=t==="plugin"&&Array.isArray(b.commands)&&typeof b.name=="string",z=a.some(f=>/\.model3?\.json$/i.test(f)),j=a.some(f=>/(^|\/)(VPet.*\.dll|info\.lps)$/i.test(f)),m=g||h||z||j,y=Object.values(e).reduce((f,k)=>f+k.length,0),E=t==="plugin"&&a.find(f=>e[f].length>5*1024*1024),D=t==="plugin"&&(y>32*1024*1024||E),N=l?"invalid":d?D?"partial":"native":g?"partial":m?"external":"invalid",v={archive:!0,preview:d&&t==="pet",actions:d&&t==="pet",aiBindings:d&&t==="pet",configuration:d&&t==="plugin"&&!D,originalLogic:d&&!D},w=g?"Shimeji":h?"Raycast":z?"Live2D":j?"VPet":d?c.compatibility:"\u672A\u8BC6\u522B\u683C\u5F0F",I=[l,D?E?`\u6587\u4EF6\u8D85\u8FC7\u63D2\u4EF6 5 MB \u4E0A\u9650\uFF1A${E}\u3002`:"\u8D85\u8FC7\u63D2\u4EF6 32 MB \u4E0A\u9650\u3002":"",g?"\u539F\u903B\u8F91\u4ECD\u9700\u4E13\u7528\u5F15\u64CE\u3002":"",m&&!g?"\u9700\u8981\u539F\u5BBF\u4E3B\u3002":"",!d&&!m&&!l?"\u672A\u8BC6\u522B\u8FD0\u884C\u683C\u5F0F\u3002":""].filter(Boolean),S={inspection:"static",level:N,format:w,capabilities:v,supported:["\u5B8C\u6574\u539F\u5305\u5F52\u6863\u4E0E\u4E0B\u8F7D",...d?[t==="pet"?"\u5DF2\u77E5\u684C\u5BA0\u6E05\u5355\u4E0E\u58F0\u660E\u52A8\u4F5C\u7D20\u6750":"SDK \u6E05\u5355\u3001\u5165\u53E3\u4E0E\u58F0\u660E\u9644\u4EF6"]:[]],unsupported:d?D?["\u76F4\u63A5\u8FD0\u884C\u5BFC\u5165"]:[]:["\u672C\u7CFB\u7EDF\u52A8\u4F5C\u63A7\u5236","AI \u72B6\u6001\u7ED1\u5B9A","\u672C\u7CFB\u7EDF\u8FD0\u884C\u914D\u7F6E","\u81EA\u52A8\u6267\u884C\u539F\u9879\u76EE\u903B\u8F91"],reasons:I},A=Ot(e),B={...c.workInfo};for(let f of["id","title","description","author","source","license"])typeof A[f]=="string"&&(B[f]=A[f]);let C=null;if(typeof A.presentation?.cover=="string")try{let f=q(A.presentation.cover);e[f]?C={path:f,bytes:e[f],...de(e[f])}:S.reasons.push("\u4F5C\u54C1\u5C01\u9762\u9644\u4EF6\u7F3A\u5931\uFF0C\u53EF\u91CD\u65B0\u9009\u62E9\uFF1B\u539F\u6E05\u5355\u548C\u5176\u4ED6\u6587\u4EF6\u4ECD\u4F1A\u4FDD\u7559\u3002")}catch{S.reasons.push("\u4F5C\u54C1\u5C01\u9762\u9644\u4EF6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u539F\u5305\u6587\u4EF6\u4ECD\u4F1A\u4FDD\u7559\u3002")}return{...c,manifestPath:s,assetPrefix:o,workInfo:B,cover:C,report:S,fileCount:a.length,bytes:y}}function Mt(e,t,u,a,i=null,n=new Date().toISOString()){let s={...e},o=b=>Object.keys(s).some(d=>d.toLocaleLowerCase()===b.toLocaleLowerCase()),r;if(i){let b=de(i.bytes),d=q(i.path);if(!d.toLowerCase().endsWith(`.${b.extension}`)&&!(b.extension==="jpg"&&d.toLowerCase().endsWith(".jpeg")))throw new Error("\u5C01\u9762\u6587\u4EF6\u6269\u5C55\u540D\u4E0E\u56FE\u7247\u5185\u5BB9\u4E0D\u4E00\u81F4\u3002");if(o(d)&&!(s[d]instanceof Uint8Array&&s[d].length===i.bytes.length&&s[d].every((g,h)=>g===i.bytes[h])))throw new Error("\u5C01\u9762\u8DEF\u5F84\u4E0E\u5DF2\u6709\u6587\u4EF6\u51B2\u7A81\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u5C01\u9762\u3002");s[d]=i.bytes,r={cover:d}}let c="WORK-INFO.json";for(let b=2;o(c);b++)c=`WORK-INFO-${b}.json`;s[c]=K.encode(JSON.stringify({kind:u,title:t.displayName||t.title,id:t.id,description:t.description,...a,...r?{presentation:r}:{},savedAt:n,publication:"local-draft"},null,2));let l="SHARE.md";for(let b=2;o(l);b++)l=`SHARE-${b}.md`;return s[l]=K.encode(jt(t.displayName||t.title,a,u)),s}function qt(e,t,u,a,i=null){if(![`${u}-make`,`${u}-import`].includes(a))throw new Error("\u8BF7\u9009\u62E9\u5236\u4F5C\u6216\u5BFC\u5165\u5165\u53E3\u3002");let n=Object.fromEntries(Object.entries(e).map(([r,c])=>[r,typeof c=="string"?K.encode(c):c])),s=Mt(n,t,u,Te(t),i);if(a.endsWith("-import"))return s;let o=ze(s,u);if(o.report.level!=="native")throw new Error(o.report.reasons.join(" ")||"\u5236\u4F5C\u5305\u4E0D\u7B26\u5408\u672C\u7CFB\u7EDF\u683C\u5F0F\uFF1B\u539F\u9879\u76EE\u8BF7\u4F7F\u7528\u5BFC\u5165\u5165\u53E3\u3002");if(u==="pet")if(o.manifest.mediaVersion===1)for(let r of new Set(Object.values(o.manifest.actions)))Rt(s[o.assetPrefix+r],r,o.manifest.background.mode==="alpha");else It(o.manifest,o.manifest.id);return s}function Rt(e,t,u=!1){if(!(e instanceof Uint8Array)||!e.length||e.length>100*1024*1024)throw new Error(`\u52A8\u4F5C\u7D20\u6750\u7F3A\u5931\u6216\u8D85\u8FC7 100 MB\uFF1A${t}\u3002`);let a=(c,l)=>new TextDecoder("ascii").decode(e.subarray(c,l));if(/\.mp4$/i.test(t)){if(e.length<24||a(4,8)!=="ftyp")throw new Error(`MP4 \u6587\u4EF6\u5934\u65E0\u6548\uFF1A${t}\u3002`);return null}if(/\.webm$/i.test(t)){if(e.length<16||![26,69,223,163].every((c,l)=>e[l]===c)||!a(0,Math.min(e.length,4096)).includes("webm"))throw new Error(`WebM \u6587\u4EF6\u5934\u65E0\u6548\uFF1A${t}\u3002`);return null}if(e.length<30||a(0,4)!=="RIFF"||a(8,12)!=="WEBP")throw new Error(`WebP \u6587\u4EF6\u5934\u65E0\u6548\uFF1A${t}\u3002`);let i=new DataView(e.buffer,e.byteOffset,e.byteLength),n=0,s=0,o=0,r=!1;for(let c=12;c+8<=e.length;){let l=i.getUint32(c+4,!0);if(c+8+l>e.length)throw new Error(`WebP \u5185\u5BB9\u4E0D\u5B8C\u6574\uFF1A${t}\u3002`);a(c,c+4)==="VP8X"&&l>=10&&(r=!!(e[c+8]&16),s=1+e[c+12]+(e[c+13]<<8)+(e[c+14]<<16),o=1+e[c+15]+(e[c+16]<<8)+(e[c+17]<<16)),a(c,c+4)==="ANMF"&&n++,c+=8+l+l%2}if(n<2||n>600||!s||!o||s>2048||o>2048)throw new Error(`WebP \u52A8\u4F5C\u9700\u4E3A 2 \u81F3 600 \u5E27\u3001\u5355\u5E27\u4E0D\u8D85\u8FC7 2048 \xD7 2048 \u7684\u52A8\u753B\uFF1A${t}\u3002`);if(u&&!r)throw new Error(`WebP \u52A8\u4F5C\u6CA1\u6709\u900F\u660E\u901A\u9053\uFF1A${t}\u3002`);return{width:s,height:o,frames:n}}var _t={"/index.html":{body:`<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="\u6D4F\u89C8\u684C\u5BA0\u4E0E\u63D2\u4EF6\uFF0C\u9884\u89C8\u52A8\u4F5C\uFF0C\u5236\u4F5C\u517C\u5BB9 desktop pet \u7684\u7D20\u6750\u5305\u3002AI \u6765\u6E90\u5728\u672C\u673A\u81EA\u884C\u914D\u7F6E\u3002">
  <meta name="color-scheme" content="light dark">
  <title>desktop pet \xB7 \u5E7F\u573A\u4E0E\u5236\u4F5C\u5DE5\u4F5C\u53F0</title>
  <link rel="icon" type="image/png" href="assets/brand-logo.png">
  <link rel="stylesheet" href="style.css">
  <script type="module" src="app.js"><\/script>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#pets"><img class="brand-mark" src="assets/brand-logo.png" width="36" height="36" alt="">desktop pet<span class="beta">\u9884\u89C8\u7248</span></a>
    <nav aria-label="\u7F51\u7AD9\u5BFC\u822A">
      <a href="#pets" data-route="pets">\u684C\u5BA0\u5E7F\u573A</a>
      <a href="#requests" data-route="requests">\u9700\u6C42\u5E7F\u573A</a>
      <a href="#plugins" data-route="plugins">\u63D2\u4EF6\u5E7F\u573A</a>
      <a href="#create" data-route="create">\u5171\u521B\u5E73\u53F0</a>
      <a href="#guide" data-route="guide">\u5B89\u88C5\u6307\u5357</a>
    </nav>
    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="\u5207\u6362\u6DF1\u8272\u4E3B\u9898" title="\u5207\u6362\u4E3B\u9898"><span aria-hidden="true">\u263C</span></button>
  </header>
  <main id="main">
    <div id="community-home">
      <section class="home-hero" aria-labelledby="home-title">
        <div class="home-hero-copy">
          <p class="home-badge"><span class="home-badge-dot" aria-hidden="true"></span><span id="home-collected-count">\u793E\u533A\u5171\u521B \xB7 \u6301\u7EED\u6536\u5F55</span></p>
          <h1 id="home-title" class="home-title"><span>\u5171\u521B\u5E73\u53F0</span></h1>
          <div class="home-stats" aria-label="\u5E7F\u573A\u6536\u5F55\u4FE1\u606F">
            <div class="home-stat"><strong id="home-pet-count">\u2014</strong><span>\u4F5C\u54C1\u6536\u5F55</span></div>
            <div class="home-stat"><strong id="home-category-count">\u2014</strong><span>\u5206\u7C7B\u6570</span></div>
          </div>
        </div>
        <div id="hero-pets" class="home-pet-strip" aria-label="\u7CBE\u9009\u684C\u5BA0"></div>
      </section>
      <section id="home-rankings" class="home-section home-rankings" aria-labelledby="home-rankings-title">
        <div class="home-ranking-heading">
          <p class="home-eyebrow">\u672C\u5468</p>
          <h2 id="home-rankings-title">\u793E\u533A\u6392\u884C\u699C</h2>
          <p class="home-scope" data-activity-scope>\u8FD1 7 \u65E5 \xB7 \u672C\u6D4F\u89C8\u5668</p>
          <a class="home-section-link" href="#rankings">\u699C\u5355 <span aria-hidden="true">\u2192</span></a>
        </div>
        <div class="home-ranking-columns">
          <div><h3 class="home-ranking-label">\u684C\u5BA0 \xB7 \u8FD1 7 \u65E5\u4E92\u52A8</h3><ol id="home-pet-ranking" class="community-ranking-list"></ol></div>
          <div><h3 class="home-ranking-label">\u4F5C\u8005 \xB7 \u672C\u7AD9\u6536\u5F55</h3><ol id="home-author-ranking" class="community-ranking-list"></ol></div>
        </div>
      </section>
      <section id="home-requests" class="home-section" aria-labelledby="home-requests-title">
        <div class="home-section-heading">
          <div><p class="home-eyebrow">\u7B49\u5F85\u5236\u4F5C</p><h2 id="home-requests-title">\u8FD9\u4E9B\u5C0F\u5BA0\u7269\u8FD8\u5728\u7B49\u4EBA\u5236\u4F5C</h2></div>
          <a class="home-section-link" href="#requests">\u8FDB\u5165\u9700\u6C42\u5E7F\u573A <span aria-hidden="true">\u2192</span></a>
        </div>
        <p class="home-scope home-request-scope">\u516C\u5F00\u9700\u6C42\u4E0E\u521B\u4F5C\u63D0\u6848\uFF1B\u8349\u7A3F\u3001\u652F\u6301\u4E0E\u5173\u6CE8\u4FDD\u5B58\u5728\u6B64\u6D4F\u89C8\u5668\u3002</p>
        <div id="request-preview" class="home-request-strip"></div>
      </section>
      <section id="home-collections" class="home-section" aria-labelledby="home-collections-title">
        <div class="home-section-heading">
          <div><p class="home-eyebrow">\u7CBE\u9009\u5408\u96C6</p><h2 id="home-collections-title">\u503C\u5F97\u4E00\u8D77\u5B89\u88C5\u7684\u7CBE\u9009\u7EC4\u5408</h2></div>
          <a class="home-section-link" href="#collections">\u67E5\u770B\u5168\u90E8</a>
        </div>
        <div class="home-collection-carousel">
          <button id="collection-prev" class="home-carousel-control home-carousel-prev" type="button" aria-label="\u4E0A\u4E00\u7EC4\u5408\u96C6">\u2039</button>
          <div id="collection-preview" class="home-collection-strip"></div>
          <button id="collection-next" class="home-carousel-control home-carousel-next" type="button" aria-label="\u4E0B\u4E00\u7EC4\u5408\u96C6">\u203A</button>
        </div>
      </section>
    </div>
    <section id="plugin-rankings" class="home-section home-rankings" aria-labelledby="plugin-rankings-title" hidden>
      <div class="home-ranking-heading"><p class="home-eyebrow">\u672C\u5468</p><h2 id="plugin-rankings-title">\u63D2\u4EF6\u6392\u884C\u699C</h2><p class="home-scope" data-activity-scope>\u8FD1 7 \u65E5 \xB7 \u672C\u6D4F\u89C8\u5668</p><a class="home-section-link" href="#rankings/plugins">\u699C\u5355 \u2192</a></div>
      <div class="home-ranking-columns"><div><h3 class="home-ranking-label">\u63D2\u4EF6 \xB7 \u8FD1 7 \u65E5\u4E92\u52A8</h3><ol id="home-plugin-ranking" class="community-ranking-list"></ol></div><div><h3 class="home-ranking-label">\u4F5C\u8005 / \u7EF4\u62A4\u8005 \xB7 \u672C\u7AD9\u6536\u5F55</h3><ol id="home-plugin-author-ranking" class="community-ranking-list"></ol></div></div>
    </section>
    <section id="gallery-view">
      <div class="gallery-header">
        <div class="gallery-title-group">
          <h1 id="gallery-title">\u684C\u5BA0\u5E7F\u573A</h1>
          <p id="gallery-total">\u6B63\u5728\u8BFB\u53D6\u4F5C\u54C1\u2026</p>
        </div>
        <div class="gallery-controls-group">
          <p id="gallery-status" class="gallery-status" aria-live="polite">\u70B9\u8D5E\u3001\u4E0B\u8F7D\u4E0E\u8FD1\u671F\u8D8B\u52BF\u4EC5\u8BB0\u5F55\u5728\u6B64\u6D4F\u89C8\u5668\uFF0C\u4E0D\u4EE3\u8868\u5168\u7AD9\u7EDF\u8BA1\u3002</p>
          <div class="gallery-controls">
            <button id="gallery-random" class="secondary" type="button"><span aria-hidden="true">\u2684</span>\u968F\u673A\u53D1\u73B0</button>
            <label class="sort-label"><span class="sr-only">\u5E7F\u573A\u6392\u5E8F</span><select id="sort"><option value="random">\u968F\u673A</option><option value="downloads" title="\u6309\u6B64\u6D4F\u89C8\u5668\u53D1\u8D77 ZIP \u4E0B\u8F7D\u7684\u6B21\u6570\u6392\u5E8F">\u6700\u591A\u4E0B\u8F7D</option><option value="likes">\u6700\u591A\u70B9\u8D5E</option><option value="trending">\u8FD1\u671F\u8D8B\u52BF</option><option value="name">\u540D\u79F0\uFF08A \u2192 Z\uFF09</option></select></label>
          </div>
        </div>
      </div>
      <h2 id="catalog-title" class="sr-only">\u684C\u5BA0\u4F5C\u54C1</h2>
      <div class="gallery-toolbar">
        <label class="search"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg><input id="search" type="search" placeholder="\u641C\u7D22\u684C\u5BA0\u3001\u4F5C\u8005\u3001\u6807\u7B7E\u2026" aria-label="\u641C\u7D22\u5E7F\u573A"><kbd aria-hidden="true">/</kbd></label>
      </div>
      <div class="category-bar" role="group" aria-label="\u7B5B\u9009\u5206\u7C7B"></div>
      <div id="cards" class="gallery-grid"></div>
      <div id="empty" class="empty" hidden><h2>\u6682\u65F6\u6CA1\u6709\u5339\u914D\u7684\u4F5C\u54C1</h2><p>\u6362\u4E00\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u8005\u628A\u5B83\u53D8\u6210\u4F60\u7684\u4E0B\u4E00\u4E2A\u4F5C\u54C1\u3002</p><button id="clear-search" class="secondary" type="button">\u6E05\u9664\u7B5B\u9009</button></div>
      <div class="gallery-pagination"><p id="result-count" class="result-count" aria-live="polite"></p><button id="gallery-more" class="secondary" type="button" hidden>\u52A0\u8F7D\u66F4\u591A</button></div>
    </section>
    <section id="rankings-view" class="community-page" hidden>
      <div class="ranking-page-heading"><div><p class="home-eyebrow">\u53D1\u73B0\u793E\u533A\u4F5C\u54C1</p><h1>\u793E\u533A\u6392\u884C\u699C</h1><p id="ranking-scope" class="community-scope">\u6B63\u5728\u8BFB\u53D6\u4E92\u52A8\u8BB0\u5F55\u3002</p></div><dl class="ranking-snapshot"><div><dt>\u7EDF\u8BA1\u5FEB\u7167</dt><dd id="ranking-snapshot">\u2014</dd></div><div><dt>\u66F4\u65B0\u9891\u7387</dt><dd id="ranking-refresh">\u9875\u9762\u8BFB\u53D6\u65F6\u66F4\u65B0</dd></div></dl></div>
      <div id="ranking-kinds" class="community-filter ranking-kinds" role="group" aria-label="\u4F5C\u54C1\u7C7B\u578B"><button type="button" data-ranking-kind="pets" aria-pressed="true">\u684C\u5BA0\u699C\u5355</button><button type="button" data-ranking-kind="plugins" aria-pressed="false">\u63D2\u4EF6\u699C\u5355</button></div>
      <div class="ranking-controls">
        <div id="ranking-tabs" class="ranking-view-tabs" role="tablist" aria-label="\u699C\u5355\u7C7B\u578B"><button type="button" role="tab" data-ranking-view="works" aria-selected="true">\u4F5C\u54C1</button><button type="button" role="tab" data-ranking-view="authors" aria-selected="false">\u8D21\u732E\u8005</button><button type="button" role="tab" data-ranking-view="collections" aria-selected="false">\u7CFB\u5217</button></div>
        <div id="ranking-period-buttons" class="community-filter" role="group" aria-label="\u65F6\u95F4\u8303\u56F4"><button type="button" data-ranking-period="week" aria-pressed="true">\u672C\u5468</button><button type="button" data-ranking-period="all" aria-pressed="false">\u603B\u699C</button></div><select id="ranking-period" hidden aria-label="\u65F6\u95F4\u8303\u56F4"><option value="week">\u672C\u5468</option><option value="all">\u603B\u699C</option></select>
      </div>
      <ol id="ranking-list" class="community-ranking-list community-ranking-page-list"></ol>
    </section>
    <section id="contributors-view" class="community-page" hidden>
      <a id="contributor-back" class="community-back" href="#rankings/authors">\u2190 \u8FD4\u56DE\u699C\u5355</a>
      <div class="contributor-heading"><div class="contributor-introduction"><p class="home-eyebrow">\u793E\u533A\u521B\u4F5C\u8005</p><h1 id="contributor-name"></h1><p id="contributor-handle" class="contributor-handle"></p><p id="contributor-description" class="community-scope"></p><div class="contributor-actions"><button id="contributor-follow" class="primary" type="button" disabled>\u5173\u6CE8</button><a id="contributor-homepage" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u4F5C\u8005\u4E3B\u9875 \u2197</a><button id="contributor-homepage-unavailable" class="secondary" type="button" disabled>\u4F5C\u8005\u4E3B\u9875</button></div><p id="contributor-follow-status" class="contributor-service-status" aria-live="polite"></p></div><dl class="contributor-statistics"><div><dd id="contributor-work-count">\u2014</dd><dt>\u4F5C\u54C1</dt></div><div><dd id="contributor-followers">\u2014</dd><dt>\u5173\u6CE8\u8005</dt></div><div><dd id="contributor-downloads">\u2014</dd><dt>\u4E0B\u8F7D</dt></div><div><dd id="contributor-likes">\u2014</dd><dt>\u70B9\u8D5E</dt></div></dl></div>
      <div class="contributor-works-heading"><h2 id="contributor-works-title">\u4F5C\u8005\u7684\u4F5C\u54C1</h2><div id="contributor-kind-tabs" class="community-filter" role="group" aria-label="\u4F5C\u8005\u4F5C\u54C1\u7C7B\u578B"></div></div><p id="contributor-statistics-scope" class="community-scope"></p><div id="contributor-works" class="gallery-grid"></div>
    </section>
    <section id="collections-view" class="community-page" hidden>
      <div class="community-page-heading"><p class="home-eyebrow">\u7CBE\u9009\u5408\u96C6</p><h1>\u627E\u5230\u503C\u5F97\u4E00\u8D77\u5B89\u88C5\u7684\u4F19\u4F34</h1><p class="community-scope">\u6309\u4F5C\u54C1\u7CFB\u5217\u6216\u5171\u540C\u4E3B\u9898\u6D4F\u89C8\u672C\u7AD9\u6536\u5F55\u7684\u684C\u5BA0\uFF0C\u6253\u5F00\u5408\u96C6\u540E\u53EF\u9010\u4E2A\u9884\u89C8\u548C\u4E0B\u8F7D\u3002</p></div>
      <div class="community-toolbar community-collection-toolbar">
        <label class="search community-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg><input id="collection-search" type="search" placeholder="\u641C\u7D22\u5408\u96C6\u6216\u4E3B\u9898\u2026" aria-label="\u641C\u7D22\u5408\u96C6"></label>
        <div id="collection-filter" class="community-filter" role="group" aria-label="\u5408\u96C6\u7C7B\u578B"><button type="button" data-collection-filter="all" aria-pressed="true">\u5168\u90E8</button><button type="button" data-collection-filter="franchise" aria-pressed="false">\u4F5C\u54C1\u7CFB\u5217</button><button type="button" data-collection-filter="theme" aria-pressed="false">\u4E3B\u9898\u7CFB\u5217</button></div>
      </div>
      <div id="collection-list" class="community-collection-grid"></div>
      <div id="collection-detail" class="community-collection-detail" hidden>
        <a class="community-back" href="#collections">\u2190 \u8FD4\u56DE\u5408\u96C6</a>
        <h2 id="collection-detail-title"></h2>
        <p id="collection-detail-description" class="community-scope"></p>
        <div id="collection-pets" class="gallery-grid"></div>
      </div>
    </section>
    <section id="requests-view" class="community-page" hidden>
      <div class="community-page-heading"><h1>\u684C\u5BA0\u9700\u6C42\u5E7F\u573A</h1></div>
      <div class="community-toolbar">
        <label class="search community-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg><input id="request-search" type="search" placeholder="\u641C\u7D22\u89D2\u8272\u6216\u5236\u4F5C\u9700\u6C42\u2026" aria-label="\u641C\u7D22\u5236\u4F5C\u9700\u6C42"></label>
        <label class="community-inline-label">\u7B5B\u9009<select id="request-state"><option value="all">\u5168\u90E8\u9700\u6C42</option><option value="waiting">\u5F85\u5236\u4F5C</option><option value="following">\u6211\u5173\u6CE8\u7684</option></select></label>
        <button id="export-requests" class="secondary" type="button">\u5BFC\u51FA\u6211\u7684\u9700\u6C42</button>
      </div>
      <div id="request-list" class="community-request-grid"></div>
      <form id="request-form" class="community-request-form">
        <div class="community-form-heading"><h2>\u7533\u8BF7\u4F60\u559C\u6B22\u7684\u89D2\u8272</h2></div>
        <div class="field-grid"><label>\u89D2\u8272\u6216\u4F5C\u54C1\u540D\u79F0<input name="title" required maxlength="80" placeholder="\u4F8B\u5982\uFF1A\u6234\u8033\u673A\u7684\u4E91\u6735\u5C0F\u732B"></label><label>\u5206\u7C7B<select name="category"><option>\u539F\u521B\u89D2\u8272</option><option>\u6E38\u620F\u89D2\u8272</option><option>\u52A8\u6F2B\u89D2\u8272</option><option>\u5409\u7965\u7269</option><option>\u5176\u4ED6</option><option>\u673A\u5668\u4EBA</option><option>\u4EBA\u7269\u5934\u50CF</option><option>\u52A8\u7269\u4F19\u4F34</option><option>\u5E7B\u60F3\u751F\u7269</option><option>\u7F51\u7EDC\u6897\u56FE</option><option>\u7269\u4EF6\u4E0E\u9053\u5177</option></select></label></div>
        <label>\u5236\u4F5C\u8BF4\u660E<textarea name="description" required maxlength="1000" rows="4" placeholder="\u5B83\u7684\u6A21\u6837\u3001\u4E2A\u6027\u6216\u4F60\u60F3\u770B\u5230\u7684\u52A8\u4F5C\u2026"></textarea></label>
        <div class="community-form-actions"><label>\u56FE\u96C6\u7248\u672C<select name="version"><option value="2">V2 \xB7 \u52A8\u4F5C\u4E0E 16 \u5411\u6CE8\u89C6</option><option value="1">V1 \xB7 \u4E5D\u7EC4\u52A8\u4F5C</option></select></label><button id="request-publish" class="primary" type="submit" disabled>\u53D1\u5E03\u5236\u4F5C\u9700\u6C42</button><button class="secondary" type="submit">\u4FDD\u5B58\u8349\u7A3F</button><a id="request-public-site" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u524D\u5F80\u516C\u5F00\u5171\u521B\u5E73\u53F0</a></div>
        <p id="request-feedback" class="community-feedback" role="status" aria-live="polite"></p><a id="request-submission-link" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u6253\u5F00\u672C\u7AD9\u9700\u6C42\u6295\u7A3F</a>
      </form>
      <div id="request-export" class="form-panel" hidden>
        <h2>\u6211\u7684\u5236\u4F5C\u9700\u6C42\u8BF4\u660E</h2>
        <p class="community-scope">\u53EF\u4FDD\u5B58 Markdown\uFF0C\u4E5F\u53EF\u4EE5\u590D\u5236\u540E\u4EA4\u7ED9\u4F60\u9009\u62E9\u7684 AI\u3002</p>
        <label>\u5236\u4F5C\u9700\u6C42 Markdown<textarea id="request-export-text" readonly rows="10"></textarea></label>
        <button id="copy-request-export" class="secondary" type="button">\u590D\u5236\u5236\u4F5C\u9700\u6C42</button>
      </div>
    </section>
    <section id="create-view" hidden>
      <div class="gallery-heading"><div><p class="eyebrow">\u521B\u4F5C\u8005\u5DE5\u4F5C\u53F0</p><h1>\u5171\u521B\u5E73\u53F0</h1></div><a class="button secondary" href="#pets">\u8FD4\u56DE\u5E7F\u573A</a></div>
      <nav class="creation-tabs" aria-label="\u5171\u521B\u5165\u53E3"><a class="button secondary" href="#create/pet-make" data-creator-route="pet-make">\u5236\u4F5C\u684C\u5BA0</a><a class="button secondary" href="#create/plugin-make" data-creator-route="plugin-make">\u5236\u4F5C\u63D2\u4EF6</a><a class="button secondary" href="#create/pet-import" data-creator-route="pet-import">\u5BFC\u5165\u684C\u5BA0</a><a class="button secondary" href="#create/plugin-import" data-creator-route="plugin-import">\u5BFC\u5165\u63D2\u4EF6</a></nav>
      <div id="creator-start" class="form-panel"><h2>\u9009\u62E9\u4E00\u79CD\u5171\u521B\u65B9\u5F0F</h2></div>
      <h2 id="creator-workflow-title" hidden></h2>
      <div class="form-panel plugin-publication-panel"><p id="plugin-publication-status" class="hint" role="status">\u6B63\u5728\u68C0\u67E5\u6295\u7A3F\u670D\u52A1\u2026</p><a id="plugin-public-site" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u524D\u5F80\u516C\u5F00\u5171\u521B\u5E73\u53F0</a><a id="creator-submission-link" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u6253\u5F00\u672C\u7AD9\u6295\u7A3F\u8868\u5355</a><p id="plugin-publication-help" class="hint"></p></div>
      <div id="pet-form-panel" aria-label="\u684C\u5BA0\u4F5C\u54C1\u5DE5\u4F5C\u53F0" hidden>
        <form id="pet-form" class="creator-layout">
          <div class="form-panel">
            <h2>\u4F5C\u54C1\u4FE1\u606F</h2>
            <div class="field-grid"><label>\u540D\u79F0<input name="displayName" required maxlength="80" placeholder="\u4F8B\u5982\uFF1A\u4E91\u6735\u5C0F\u732B"></label><label>\u4F5C\u54C1 ID<input name="id" required maxlength="64" pattern="[a-z0-9][a-z0-9_-]{0,63}" placeholder="\u4F8B\u5982\uFF1Acloud-cat"></label></div>
            <label>\u7B80\u4ECB<textarea name="description" required maxlength="500" rows="3" placeholder="\u5B83\u662F\u4EC0\u4E48\u6837\u7684\u4F19\u4F34\uFF1F"></textarea></label>
            <div class="field-grid"><label>\u4F5C\u8005<input name="author" required maxlength="120" placeholder="\u4F60\u7684\u7F72\u540D"></label><label>\u8BB8\u53EF\u58F0\u660E<input name="license" required maxlength="200" placeholder="\u4F8B\u5982\uFF1ACC BY-NC 4.0 \u6216\u4E2A\u4EBA\u4F7F\u7528"></label></div>
            <input name="source" type="hidden" value="">
            <div id="pet-make-fields">
              <label>\u52A8\u4F5C\u7D20\u6750\u65B9\u5F0F<select id="pet-media-mode"><option value="video">\u9010\u52A8\u4F5C\u89C6\u9891 / \u52A8\u753B WebP</option><option value="atlas">WebP \u56FE\u96C6</option></select></label>
              <div id="pet-video-fields"><label class="upload-label">\u6DFB\u52A0\u52A8\u4F5C\u6587\u4EF6<input id="clip-input" type="file" accept="video/mp4,video/webm,image/webp,.mp4,.webm,.webp" multiple></label><p class="hint">\u6BCF\u4E2A\u6587\u4EF6\u662F\u4E00\u4E2A\u72EC\u7ACB\u52A8\u4F5C\u3002\u540D\u79F0\u3001\u79CD\u7C7B\u548C\u4E0E AI \u72B6\u6001\u7684\u5BF9\u5E94\u5173\u7CFB\u5747\u53EF\u81EA\u5B9A\u4E49\uFF0C\u672A\u7ED1\u5B9A\u72B6\u6001\u663E\u793A\u5F85\u673A\u3002\u5355\u6587\u4EF6 100 MB\uFF0C\u603B\u8BA1 200 MB\u3002</p><div id="clip-list" class="creator-clips"></div><div class="field-grid"><label>\u80CC\u666F\u5904\u7406<select id="clip-background"><option value="chroma">\u7EAF\u8272\u80CC\u666F\u53BB\u80CC</option><option value="alpha">\u7D20\u6750\u81EA\u5E26\u900F\u660E\u901A\u9053</option></select></label><label id="clip-color-label">\u80CC\u666F\u989C\u8272<input id="clip-color" type="color" value="#00ff00"></label></div><details><summary>AI \u4E0E\u4EA4\u4E92\u52A8\u4F5C\u7ED1\u5B9A</summary><div id="state-bindings" class="field-grid"></div></details></div>
              <div id="pet-atlas-fields" hidden><label class="upload-label">\u9009\u62E9 WebP \u56FE\u96C6<input id="atlas-input" type="file" accept="image/webp,.webp"></label><p class="hint">V1\uFF1A1536 \xD7 1872\uFF1BV2\uFF1A1536 \xD7 2288\u3002\u6BCF\u683C 192 \xD7 208\uFF0C8 \u5217\uFF0C\u900F\u660E\u80CC\u666F\u3002\u6700\u5927 24 MB\u3002</p></div>
            </div>
            <div id="pet-import-fields" hidden><h3>\u5148\u5BFC\u5165\u539F\u9879\u76EE\u6587\u4EF6</h3><div class="package-upload-options"><label class="upload-label">ZIP<input id="pet-package-zip" type="file" accept=".zip,application/zip"></label><label class="upload-label">\u5B8C\u6574\u6587\u4EF6\u5939<input id="pet-package-folder" type="file" webkitdirectory multiple></label><label class="upload-label">\u6E05\u5355\u4E0E\u914D\u5957\u6587\u4EF6<input id="pet-package-files" type="file" multiple></label></div><div id="pet-compatibility" class="compatibility-report" hidden></div><p id="pet-package-status" class="hint" role="status">\u5C1A\u672A\u5BFC\u5165\u6587\u4EF6</p><div id="pet-import-capabilities" class="import-capabilities"><button class="secondary" type="button" data-import-preview disabled>\u9884\u89C8\u539F\u7D20\u6750</button><button class="secondary" type="button" disabled title="\u5BFC\u5165\u4FDD\u7559\u539F\u6E05\u5355\uFF0C\u4E0D\u5728\u7F51\u9875\u6539\u5199\u6620\u5C04">AI \u52A8\u4F5C\u7ED1\u5B9A\u7531\u539F\u6E05\u5355\u5B9A\u4E49</button><p id="pet-import-capability-note" class="hint">\u5BFC\u5165\u540E\u663E\u793A\u672C\u7CFB\u7EDF\u652F\u6301\u8303\u56F4\u3002</p></div><div id="pet-import-preview" class="preview-stage" hidden></div><ul id="pet-package-list" class="package-file-list"></ul></div>
            <div class="creator-submit-actions"><button id="pet-publish" class="primary" type="submit" disabled>\u6253\u5305\u5E76\u53D1\u5E03</button><button id="pet-download-backup" class="secondary" type="button">\u4E0B\u8F7D\u5206\u4EAB ZIP</button><button class="secondary" type="button" data-save-draft="pet">\u4FDD\u5B58\u8349\u7A3F</button><button class="secondary" type="button" data-restore-draft="pet">\u6062\u590D\u8349\u7A3F</button></div>
          </div>
          <aside class="preview-panel">
            <span class="eyebrow">\u52A8\u4F5C\u9884\u89C8</span>
            <div id="creator-pet-stage" class="preview-stage"><p>\u9009\u62E9\u56FE\u96C6\u540E\uFF0C\u5728\u8FD9\u91CC\u9884\u89C8</p></div>
            <label>\u9884\u89C8\u80CC\u666F<select id="creator-background"><option value="checker">\u900F\u660E\u68CB\u76D8</option><option value="light">\u6D45\u8272\u80CC\u666F</option><option value="dark">\u6DF1\u8272\u80CC\u666F</option></select></label>
            <label>\u9884\u89C8\u52A8\u4F5C<select id="creator-action" disabled></select></label>
            <div id="creator-action-buttons" class="action-grid" role="group" aria-label="\u4E0A\u4F20\u56FE\u96C6\u7684\u4E5D\u7EC4\u52A8\u4F5C"></div>
            <div id="creator-look-section" hidden>
              <h3 class="preview-subheading">16 \u5411\u6CE8\u89C6</h3>
              <div id="creator-look-buttons" class="look-grid" role="group" aria-label="\u4E0A\u4F20\u56FE\u96C6\u7684\u5341\u516D\u65B9\u5411\u6CE8\u89C6"></div>
            </div>
            <p id="creator-current-preview" class="hint" role="status">\u9009\u62E9\u56FE\u96C6\u540E\u5373\u53EF\u9884\u89C8</p>
            
            <p id="atlas-status" class="hint" role="status">\u7B49\u5F85\u9009\u62E9\u56FE\u96C6</p>
            
          </aside>
        </form>
      </div>
      <div id="plugin-form-panel" aria-label="\u63D2\u4EF6\u4F5C\u54C1\u5DE5\u4F5C\u53F0" hidden>
        <form id="plugin-form" class="creator-layout">
          <div class="form-panel"><h2 id="plugin-upload-title">\u4E0A\u4F20\u4F60\u5236\u4F5C\u7684\u63D2\u4EF6</h2><div id="plugin-file-fields"><div class="package-upload-options"><label class="upload-label">ZIP<input id="plugin-package-zip" type="file" accept=".zip,application/zip"></label><label class="upload-label">\u5B8C\u6574\u6587\u4EF6\u5939<input id="plugin-package-folder" type="file" webkitdirectory multiple></label><label class="upload-label">\u6E05\u5355\u4E0E\u914D\u5957\u6587\u4EF6<input id="plugin-package-files" type="file" multiple></label></div><div id="plugin-compatibility" class="compatibility-report" hidden></div></div><h3>\u4F5C\u54C1\u4FE1\u606F</h3><div class="field-grid"><label>\u63D2\u4EF6\u540D\u79F0<input name="title" required maxlength="120" placeholder="\u6211\u7684\u63D2\u4EF6"></label><label>\u4F5C\u54C1 ID<input name="id" required maxlength="64" placeholder="author.my-plugin"></label></div><label>\u8BF4\u660E<textarea name="description" required maxlength="1000" rows="3" placeholder="\u529F\u80FD\u3001\u9002\u7528\u73AF\u5883\u4E0E\u5B89\u88C5\u6761\u4EF6"></textarea></label><div class="field-grid"><label>\u4F5C\u8005<input name="author" required maxlength="120" placeholder="\u4F60\u7684\u7F72\u540D"></label><label>\u8BB8\u53EF\u58F0\u660E<input name="license" required maxlength="200" placeholder="\u4F8B\u5982\uFF1AMIT"></label></div><input name="source" type="hidden" value=""><label class="upload-label">\u63D2\u4EF6\u5E7F\u573A\u5361\u7247\u5C01\u9762\uFF08\u53EF\u9009\uFF09<input id="plugin-cover-input" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"></label><button id="plugin-cover-remove" class="secondary" type="button" hidden>\u79FB\u9664\u672C\u6B21\u5C01\u9762</button><div class="creator-submit-actions"><button id="plugin-publish" class="primary" type="submit" disabled>\u6253\u5305\u5E76\u53D1\u5E03</button><button id="plugin-download-backup" class="secondary" type="button">\u4E0B\u8F7D\u5206\u4EAB ZIP</button><button class="secondary" type="button" data-save-draft="plugin">\u4FDD\u5B58\u8349\u7A3F</button><button class="secondary" type="button" data-restore-draft="plugin">\u6062\u590D\u8349\u7A3F</button></div></div>
          <aside class="preview-panel"><span class="eyebrow">\u63D2\u4EF6\u5E7F\u573A\u5361\u7247\u9884\u89C8</span><div id="plugin-card-preview"></div><h3>\u4F5C\u54C1\u6587\u4EF6</h3><p id="plugin-package-status" class="hint" role="status">\u5C1A\u672A\u5BFC\u5165\u6587\u4EF6</p><ul id="plugin-package-list" class="package-file-list"></ul><h3>\u58F0\u660E\u6743\u9650</h3><p id="permission-preview">\u5C1A\u672A\u8BFB\u53D6\u6E05\u5355</p><div class="import-capabilities"><button class="secondary" type="button" disabled>\u8FD0\u884C\u63D2\u4EF6</button><button class="secondary" type="button" disabled>\u8FD0\u884C\u914D\u7F6E</button><p id="plugin-import-capability-note" class="hint"></p></div></aside>
        </form>
      </div>
      <p id="creator-publishing-note" class="hint creator-publishing-note">\u63D0\u4EA4\u6295\u7A3F\u540E\uFF0C\u5BA1\u6838\u6536\u5F55\u624D\u4F1A\u5728\u5E7F\u573A\u663E\u793A\u3002</p>
      <p id="creator-feedback" class="feedback" role="status" aria-live="polite"></p>
    </section>
    <section id="guide-view" hidden>
      <div class="gallery-heading"><div><p class="eyebrow">\u4ECE\u7F51\u7AD9\u5230\u684C\u9762</p><h1>\u4E0B\u8F7D\uFF0C\u5BFC\u5165\uFF0C\u5F00\u59CB\u966A\u4F34</h1></div></div>
      <div class="guide-grid"><article class="form-panel"><span class="step">01</span><h2>\u5B89\u88C5\u684C\u5BA0</h2><p>\u5728\u5E7F\u573A\u9884\u89C8\u52A8\u4F5C\uFF0C\u4E0B\u8F7D\u684C\u5BA0 ZIP\u3002\u6253\u5F00\u63A7\u5236\u4E2D\u5FC3\u300C\u6211\u7684\u684C\u5BA0\u300D\uFF0C\u9009\u62E9\u300C\u5BFC\u5165 ZIP \u6216\u6587\u4EF6\u5939\u300D\u5E76\u5BFC\u5165 ZIP\uFF0C\u7136\u540E\u8BBE\u4E3A\u684C\u9762\u4F19\u4F34\u3002</p><p>\u5DF2\u5B58\u5728\u7684\u7F16\u53F7\u4F1A\u6309\u672C\u5730\u5BFC\u5165\u89C4\u5219\u5904\u7406\uFF0C\u5185\u7F6E\u684C\u5BA0\u65E0\u9700\u518D\u6B21\u5B89\u88C5\u3002</p></article><article class="form-panel"><span class="step">02</span><h2>\u5B89\u88C5\u63D2\u4EF6</h2><p>\u4E0B\u8F7D\u63D2\u4EF6 ZIP \u5E76\u89E3\u538B\u3002\u5728\u300C\u63D2\u4EF6\u7BA1\u7406\u300D\u9009\u62E9\u300C\u5BFC\u5165\u63D2\u4EF6\u6587\u4EF6\u5939\u300D\uFF0C\u9009\u4E2D\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u3002\u9605\u8BFB\u5E76\u786E\u8BA4\u6743\u9650\u540E\u518D\u542F\u7528\u3002</p><p>\u63D0\u9192\u662F\u5426\u5F00\u542F\u3001\u8FD0\u884C\u9891\u7387\u4E0E\u505C\u7528\u64CD\u4F5C\u7531\u672C\u673A\u63A7\u5236\u3002</p></article><article class="form-panel"><span class="step">03</span><h2>\u8FDE\u63A5\u4F60\u9009\u62E9\u7684 AI</h2><p>\u5728\u63A7\u5236\u4E2D\u5FC3\u300C\u5BA0\u7269\u5927\u8111\u300D\u914D\u7F6E\u591A\u4E2A\u63D0\u4F9B\u65B9\u6216\u517C\u5BB9\u63A5\u53E3\uFF1B\u5728\u300C\u5916\u90E8 AI \u63A5\u5165\u300D\u8FDE\u63A5\u652F\u6301\u7684\u672C\u673A\u5DE5\u5177\u3002\u5916\u89C2\u7D20\u6750\u4E0D\u7ED1\u5B9A\u5355\u4E00 AI\u3002</p><p>\u5BC6\u94A5\u3001\u4EBA\u8BBE\u3001\u804A\u5929\u4E0E\u7535\u8111\u6587\u4EF6\u90FD\u7559\u5728\u672C\u5730\u914D\u7F6E\u6D41\u7A0B\u4E2D\u3002</p></article></div>
    </section>
  </main>
  <footer><span>desktop pet</span><p>\u4F5C\u54C1\u5728\u7F51\u7AD9\u76F8\u9047\uFF0C\u966A\u4F34\u5728\u4F60\u7684\u684C\u9762\u53D1\u751F\u3002</p><a href="#guide">\u5B89\u88C5\u6307\u5357</a></footer>
  <dialog id="pet-detail" aria-labelledby="detail-title">
    <div class="dialog-heading"><h2 id="detail-title">\u684C\u5BA0\u52A8\u4F5C\u9884\u89C8</h2><button id="close-detail" class="secondary" aria-label="\u5173\u95ED\u8BE6\u60C5">\u5173\u95ED</button></div>
    <div class="detail-layout">
      <div class="detail-visual">
        <div id="detail-pet-stage" class="preview-stage"><div id="detail-sprite" class="sprite large" role="img" aria-label="\u684C\u5BA0\u52A8\u4F5C"></div></div>
        <label>\u9884\u89C8\u80CC\u666F<select id="detail-background"><option value="checker">\u900F\u660E\u68CB\u76D8</option><option value="light">\u6D45\u8272\u80CC\u666F</option><option value="dark">\u6DF1\u8272\u80CC\u666F</option></select></label>
        <p id="detail-current-preview" class="hint" role="status">\u6B63\u5728\u9884\u89C8\uFF1A\u5B89\u9759\u966A\u4F34</p>
      </div>
      <div class="detail-information">
        <p id="detail-author" class="byline"></p>
        <p id="detail-description"></p>
        <label>\u52A8\u4F5C<select id="detail-action"></select></label>
        <div id="detail-action-buttons" class="action-grid" role="group" aria-label="\u4E5D\u7EC4\u52A8\u4F5C"></div>
        <div id="detail-look-section">
          <h3 class="preview-subheading">16 \u5411\u6CE8\u89C6</h3>
          <p class="hint">\u4EE5\u5C4F\u5E55\u4E3A\u65B9\u5411\uFF1A0\xB0 \u5411\u4E0A\uFF0C90\xB0 \u5411\u53F3\u3002\u70B9\u51FB\u67E5\u770B\u5B9E\u9645\u5355\u5E27\u59FF\u6001\u3002</p>
          <div id="detail-look-buttons" class="look-grid" role="group" aria-label="\u5341\u516D\u65B9\u5411\u6CE8\u89C6"></div>
        </div>
        <div class="dialog-actions"><a id="detail-download" class="button primary" download>\u4E0B\u8F7D\u684C\u5BA0 ZIP</a></div>
      </div>
    </div>
  </dialog>
  <p id="toast" class="toast" role="status" hidden></p>
</body>
</html>
`,type:"text/html; charset=utf-8"},"/style.css":{body:`:root {
  --bg: #fff; --surface: #f7f7f8; --raised: #fff; --ink: #0d0d0d;
  --muted: #6e6e80; --line: #e5e5e5; --line-hover: #d1d1d1;
  --accent: #10a37f; --accent-hover: #0d8c6d; --accent-light: #e6f7f2;
  --font: "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color-scheme: light; font-size: 16px;
}
html[data-theme="dark"] {
  --bg: #0d0d0d; --surface: #171717; --raised: #131313; --ink: #f5f5f5;
  --muted: #a1a1aa; --line: #2f2f2f; --line-hover: #444;
  --accent: #34c89a; --accent-hover: #55d6ac; --accent-light: #12392f;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font); line-height: 1.5; }
button, input, select, textarea { font: inherit; }
button, a, input, select, textarea { touch-action: manipulation; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button, .button {
  cursor: pointer; border: 1px solid var(--line); border-radius: 8px; padding: 9px 14px;
  font-size: .875rem; font-weight: 500; display: inline-flex; align-items: center;
  justify-content: center; gap: 8px; min-height: 40px; text-decoration: none;
  transition: background .18s, border-color .18s, box-shadow .18s;
}
button:hover, .button:hover { text-decoration: none; border-color: var(--line-hover); }
button:disabled { cursor: wait; opacity: .6; }
.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.secondary { background: var(--raised); color: var(--ink); }
.secondary:hover { background: var(--surface); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
[hidden] { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

/* \u5E7F\u573A\u91C7\u7528\u53C2\u8003\u7AD9\u7684\u767D\u7EFF\u4E3B\u9898\u3001\u5168\u5BBD\u641C\u7D22\u548C\u54CD\u5E94\u7F51\u683C\u3002 */
.site-header {
  position: sticky; top: 0; z-index: 30; min-height: 56px;
  padding: 9px max(24px, calc((100vw - 1280px) / 2)); display: flex; align-items: center;
  gap: 28px; background: var(--bg); border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 700; white-space: nowrap; }
.brand:hover { text-decoration: none; }
.brand-mark { width: 36px; height: 36px; display: block; object-fit: contain; flex: 0 0 auto; }
.beta { color: var(--muted); font-size: .6875rem; font-weight: 400; border: 1px solid var(--line); padding: 1px 5px; border-radius: 5px; }
.site-header nav { display: flex; gap: 24px; flex: 1; align-items: center; }
.site-header nav a { color: var(--muted); font-size: .875rem; padding: 8px 0; }
.site-header nav a[aria-current="page"] { color: var(--accent); }
.site-header > .compact { min-height: 36px; padding: 7px 14px; font-size: .8125rem; }
.theme-toggle { width: 36px; height: 36px; min-height: 36px; padding: 0; color: var(--muted); border: 0; background: transparent; font-size: 1.25rem; }
.theme-toggle:hover { background: var(--surface); }
main { max-width: 1320px; margin: auto; padding: 24px 24px 0; }
h1, h2, h3, p { margin-top: 0; }
h1, h2, h3 { line-height: 1.3; }
h1 { font-size: clamp(1.8rem, 3vw, 2.4rem); letter-spacing: -.02em; margin: 8px 0 12px; }
h2 { font-size: 1.25rem; }
h3 { font-size: 1rem; }

/* \u9996\u9875\u6309\u793E\u533A\u5E7F\u573A\u7684\u9996\u5C4F\u3001\u699C\u5355\u3001\u9700\u6C42\u548C\u5408\u96C6\u987A\u5E8F\u5C55\u793A\u771F\u5B9E\u5185\u5BB9\u3002 */
.home-hero { margin: -24px -24px 0; padding: 56px 24px 40px; text-align: center; overflow: hidden; background-image: linear-gradient(color-mix(in srgb, var(--line) 35%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--line) 35%, transparent) 1px, transparent 1px); background-size: 48px 48px; }
html[data-theme="dark"] .home-hero { background-image: linear-gradient(#ffffff03 1px, transparent 1px), linear-gradient(90deg, #ffffff03 1px, transparent 1px); }
.home-hero-copy { max-width: 900px; margin: 0 auto; }
.home-badge { display: inline-flex; align-items: center; gap: 9px; margin: 0 0 28px; padding: 7px 13px; border: 1px solid var(--line); border-radius: 999px; color: var(--accent); background: var(--bg); font-size: .875rem; }
.home-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
.home-title { margin: 0 0 24px; font-size: clamp(2.75rem, 5.5vw, 4.5rem); line-height: 1.12; letter-spacing: -.04em; font-weight: 800; }
.home-title > span { color: var(--accent); }
.home-description { max-width: 760px; margin: 0 auto 32px; font-size: 1.125rem; line-height: 1.8; color: var(--muted); }
.home-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; max-width: 472px; margin: 48px auto 0; }
.home-stat { min-width: 0; padding: 17px 12px; border: 1px solid var(--line); border-radius: 16px; background: var(--bg); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 3px; }
.home-stat > strong { font-size: 2.25rem; line-height: 1.2; font-weight: 700; }
.home-stat > span { color: var(--muted); font-size: .8125rem; }
.home-pet-strip { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 24px; max-width: 1200px; margin: 64px auto 0; }
.home-pet-card { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 0; padding: 16px 8px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--raised); color: var(--ink); transition: border-color .18s, background .18s; }
.home-pet-card:hover { border-color: var(--accent); text-decoration: none; background: var(--surface); }
.home-pet-card > img { width: 100%; height: 160px; object-fit: contain; }
.home-pet-card > span { display: block; width: 100%; font-size: .75rem; margin-top: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-section { padding: 48px 0; border-bottom: 1px solid var(--line); }
.home-section-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 24px; }
.home-eyebrow { color: var(--accent); font-weight: 600; font-size: .8125rem; margin: 0 0 8px; }
.home-section h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }
.home-section-link { font-size: .875rem; font-weight: 500; white-space: nowrap; }
.home-scope { font-size: .75rem; line-height: 1.6; color: var(--muted); margin: 12px 0 16px; }
.home-request-scope { margin: -12px 0 20px; }
.home-rankings { display: grid; grid-template-columns: minmax(180px, .25fr) minmax(0, .75fr); align-items: center; gap: 36px; }
.home-ranking-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; min-width: 0; }
.home-ranking-label { color: var(--muted); font-size: .8125rem; font-weight: 500; margin: 0 0 10px; }
.community-ranking-list { list-style: none; padding: 0; margin: 0; }
.community-ranking-row { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 66px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.community-ranking-row:last-child { border-bottom: 0; }
.community-rank-position { color: var(--muted); font-size: .75rem; }
.community-rank-work { display: flex; align-items: center; gap: 12px; min-width: 0; color: var(--ink); font-size: .875rem; font-weight: 500; }
.community-rank-work:hover { color: var(--accent); text-decoration: none; }
.community-rank-work img { width: 36px; height: 44px; object-fit: contain; flex: 0 0 auto; }
.community-rank-work > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.community-rank-work .community-author-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--surface); border: 1px solid var(--line); }
.community-rank-value { color: var(--muted); font-size: .75rem; white-space: nowrap; }
.home-request-strip { display: grid; grid-template-columns: repeat(4, minmax(300px, 1fr)); gap: 16px; overflow-x: auto; overscroll-behavior-x: contain; padding-bottom: 8px; scrollbar-width: thin; }
.community-request-card { display: grid; grid-template-columns: minmax(76px, .3fr) minmax(0, .7fr); border: 1px solid var(--line); background: var(--raised); border-radius: 10px; overflow: hidden; min-width: 0; }
.community-request-visual { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; background: var(--surface); overflow: hidden; }
.community-request-visual > img { width: 100%; height: 100%; max-height: 280px; object-fit: contain; }
.community-request-visual > span { color: var(--accent); font-size: 3rem; }
.community-request-visual > small { color: var(--muted); font-size: .625rem; padding: 0 8px; text-align: center; }
.community-request-body { min-width: 0; padding: 14px 12px; display: flex; flex-direction: column; }
.community-request-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 10px; }
.community-request-meta > span { padding: 3px 6px; border-radius: 5px; color: var(--accent); background: var(--accent-light); font-size: .6875rem; }
.community-request-meta > small { color: var(--muted); font-size: .6875rem; }
.community-request-title { color: var(--ink); margin: 0 0 8px; font-size: .9375rem; line-height: 1.5; overflow-wrap: anywhere; }
.community-request-description { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; color: var(--muted); font-size: .75rem; line-height: 1.6; margin: 0 0 14px; min-height: 38px; }
.community-request-footnote { margin-top: auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 5px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--muted); font-size: .625rem; }
.community-request-actions { display: flex; align-items: stretch; gap: 6px; margin-top: 10px; }
.community-request-actions button { flex: 1; min-width: 0; min-height: 36px; padding: 7px 3px; gap: 3px; font-size: .6875rem; white-space: nowrap; border-radius: 6px; }
.community-request-actions button > svg { width: 12px; height: 12px; flex: 0 0 auto; }
.community-request-actions button[aria-pressed="true"].secondary { color: var(--accent); border-color: var(--accent); background: var(--accent-light); }
.home-collection-carousel { position: relative; }
.home-collection-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.home-carousel-control { position: absolute; top: 190px; z-index: 2; display: flex; width: 40px; height: 40px; min-height: 40px; padding: 0; border-radius: 50%; color: var(--ink); background: var(--raised); font-size: 1.75rem; box-shadow: 0 4px 12px #00000012; }
.home-carousel-prev { left: 8px; }
.home-carousel-next { right: 8px; }
.community-collection-card { position: relative; min-width: 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--raised); }
.community-collection-visual { display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 270px; padding: 24px 16px; background: var(--surface); }
.community-collection-visual:hover { text-decoration: none; background: var(--surface); }
.community-collection-visual > img { min-width: 0; max-width: 23%; width: auto; height: 180px; object-fit: contain; }
.community-collection-visual > img:nth-child(2), .community-collection-visual > img:nth-child(4) { height: 220px; }
.community-collection-visual > img:only-child { max-width: 70%; height: 220px; }
.community-collection-share { position: absolute; top: 12px; right: 12px; width: 32px; min-height: 32px; padding: 7px; background: var(--raised); border-radius: 8px; color: var(--muted); }
.community-collection-body { padding: 20px 16px; }
.community-collection-kind { color: var(--accent); font-size: .75rem; font-weight: 600; margin: 0 0 10px; }
.community-collection-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.community-collection-title-row > h3 { min-width: 0; margin: 0; font-size: 1rem; font-weight: 600; }
.community-collection-title-row a { color: var(--ink); }
.community-collection-title-row a:hover { color: var(--accent); text-decoration: none; }
.community-collection-title-row > span { color: var(--muted); font-size: .75rem; white-space: nowrap; }
.community-collection-description { color: var(--muted); font-size: .8125rem; line-height: 1.6; margin: 12px 0 0; }
#community-home:not([hidden]) + #gallery-view { padding-top: 48px; }
#gallery-view { scroll-margin-top: 80px; }
.community-page { min-width: 0; padding: 12px 0 24px; }
.community-page-heading { margin-bottom: 28px; max-width: 880px; }
.community-page-heading h1 { font-size: 2rem; margin-top: 0; }
.community-scope { color: var(--muted); font-size: .875rem; line-height: 1.7; margin: 0; }
.community-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
.community-search { flex: 1; min-width: 240px; }
.community-filter { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.community-filter > button { background: var(--raised); color: var(--muted); min-height: 36px; padding: 7px 14px; font-size: .8125rem; }
.community-filter > button[aria-pressed="true"], .community-filter > button[aria-selected="true"] { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
.community-inline-label { flex-direction: row; align-items: center; gap: 10px; margin: 0; color: var(--muted); white-space: nowrap; font-size: .8125rem; }
.community-inline-label select { width: auto; min-height: 40px; font-size: .8125rem; background: var(--raised); }
.community-ranking-page-list { border: 1px solid var(--line); border-radius: 12px; padding: 8px 24px; background: var(--raised); }
.community-ranking-page-list .community-ranking-row { min-height: 76px; grid-template-columns: 24px minmax(0, 1fr) auto; }
.community-ranking-page-list .community-rank-work { font-size: 1rem; }
.community-ranking-page-list .community-rank-work img { width: 48px; height: 52px; }
.community-ranking-page-list .community-rank-work .community-author-avatar { height: 48px; }
.community-ranking-page-list .community-rank-value { font-size: .8125rem; }
.ranking-page-heading { display: flex; justify-content: space-between; align-items: end; gap: 32px; margin-bottom: 34px; }
.ranking-page-heading h1, .contributor-introduction h1 { font-size: clamp(2.2rem, 5vw, 3.7rem); line-height: 1.15; letter-spacing: -.045em; margin: 10px 0 16px; }
.ranking-snapshot { display: grid; grid-template-columns: repeat(2, auto); gap: 28px; margin: 0 0 6px; text-align: right; }
.ranking-snapshot dt { color: var(--muted); font-size: .75rem; margin-bottom: 6px; }
.ranking-snapshot dd { margin: 0; font-size: .8125rem; font-variant-numeric: tabular-nums; }
.ranking-kinds { margin-bottom: 22px; }
.ranking-controls { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); gap: 16px; margin-bottom: 10px; }
.ranking-view-tabs { display: flex; gap: 24px; align-self: stretch; }
.ranking-view-tabs button { background: none; border: 0; border-bottom: 2px solid transparent; border-radius: 0; padding: 14px 2px; color: var(--muted); }
.ranking-view-tabs button[aria-selected="true"] { border-color: var(--accent); color: var(--ink); }
.ranking-controls .community-filter { margin: 0; padding: 0 0 9px; }
.community-ranking-page-list { border: 0; border-radius: 0; padding: 0; background: transparent; }
.community-ranking-page-list .ranking-long-row { min-height: 140px; grid-template-columns: 32px minmax(0, 1fr) 280px; gap: 24px; padding: 20px 0; }
.ranking-long-row .community-rank-position { font-size: .9375rem; font-variant-numeric: tabular-nums; }
.ranking-entry { display: flex; align-items: center; gap: 24px; min-width: 0; color: var(--ink); }
.ranking-entry:hover { text-decoration: none; }
.ranking-entry:hover strong { color: var(--accent); }
.ranking-mosaic { display: flex; align-items: end; justify-content: center; flex: 0 0 148px; min-width: 0; height: 96px; padding: 4px; border-radius: 12px; background: var(--surface); overflow: hidden; }
.ranking-mosaic img { object-fit: contain; width: 65px; height: 88px; flex: 0 0 auto; }
.ranking-mosaic img + img { margin-left: -27px; }
.ranking-plugin-mosaic { align-items: center; }
.ranking-plugin-mosaic img { width: 96px; height: 80px; object-fit: cover; border-radius: 8px; }
.ranking-plugin-mosaic img + img { margin-left: -65px; border: 2px solid var(--raised); }
.ranking-mosaic > span { font-size: 2.2rem; }
.ranking-identity { display: flex; flex-direction: column; min-width: 0; gap: 5px; }
.ranking-identity strong { font-size: 1.125rem; line-height: 1.4; overflow-wrap: anywhere; transition: color .18s; }
.ranking-handle, .ranking-identity small { color: var(--muted); font-size: .8125rem; }
.ranking-metrics { display: grid; grid-template-columns: 1.25fr 1fr 1fr; margin: 0; gap: 18px; text-align: right; }
.ranking-metrics dd { margin: 0 0 5px; font-size: 1.125rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.ranking-metrics dt { font-size: .6875rem; color: var(--muted); white-space: nowrap; }
.contributor-heading { display: grid; grid-template-columns: minmax(0, 1fr) minmax(400px, .8fr); align-items: end; gap: 50px; padding: 34px 0 46px; border-bottom: 1px solid var(--line); }
.contributor-handle { color: var(--muted); font-size: 1.0625rem; margin: -4px 0 12px; }
.contributor-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.contributor-actions button:disabled { cursor: default; }
.contributor-service-status { font-size: .75rem; color: var(--muted); min-height: 20px; margin: 12px 0 0; }
.contributor-statistics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0 0 32px; }
.contributor-statistics > div { padding: 0 20px; border-right: 1px solid var(--line); }
.contributor-statistics > div:first-child { padding-left: 0; }
.contributor-statistics > div:last-child { border-right: 0; padding-right: 0; }
.contributor-statistics dd { margin: 0 0 4px; font-size: 2rem; font-weight: 650; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.contributor-statistics dt { color: var(--muted); font-size: .8125rem; }
.contributor-works-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 36px; }
.contributor-works-heading h2 { font-size: 1.375rem; margin: 0; }
.contributor-works-heading .community-filter { margin: 0; }
#contributor-statistics-scope { margin: 12px 0 24px; }
#contributor-works { width: 100%; }
@media (max-width: 850px) {
  .ranking-page-heading { align-items: start; flex-direction: column; gap: 16px; }
  .ranking-snapshot { text-align: left; gap: 24px; }
  .community-ranking-page-list .ranking-long-row { grid-template-columns: 24px minmax(0, 1fr) 205px; gap: 12px; }
  .ranking-entry { gap: 14px; }
  .ranking-mosaic { flex-basis: 90px; }
  .ranking-metrics { gap: 10px; }
  .contributor-heading { grid-template-columns: 1fr; gap: 26px; }
  .contributor-statistics { margin-bottom: 0; }
}
@media (max-width: 560px) {
  .ranking-controls { align-items: start; flex-direction: column; gap: 10px; }
  .ranking-view-tabs { gap: 20px; }
  .community-ranking-page-list .ranking-long-row { grid-template-columns: 24px minmax(0, 1fr); gap: 14px; }
  .ranking-entry { gap: 12px; }
  .ranking-metrics { grid-column: 2; text-align: left; }
  .ranking-metrics dd { font-size: 1rem; }
  .contributor-statistics { grid-template-columns: repeat(2, 1fr); gap: 20px 0; }
  .contributor-statistics > div { padding: 0 16px; }
  .contributor-statistics > div:nth-child(2n) { border-right: 0; }
  .contributor-statistics > div:nth-child(2n + 1) { padding-left: 0; }
  .contributor-works-heading { align-items: start; flex-direction: column; }
}
.community-collection-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.community-back { display: inline-block; margin-bottom: 24px; font-size: .875rem; }
.community-collection-detail h2 { font-size: 1.75rem; margin-bottom: 10px; }
.community-collection-detail > .community-scope { margin-bottom: 28px; }
.community-request-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.community-request-grid .community-request-card { grid-template-columns: minmax(120px, .3fr) minmax(0, .7fr); }
.community-request-grid .community-request-body { padding: 20px; }
.community-request-grid .community-request-title { font-size: 1.125rem; }
.community-request-grid .community-request-actions button { min-height: 40px; font-size: .8125rem; }
.community-request-form { margin-top: 36px; border: 1px solid var(--line); border-radius: 12px; padding: 28px; background: var(--raised); }
.community-form-heading { margin-bottom: 24px; }
.community-form-heading h2 { margin-bottom: 8px; }
.community-form-actions { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.community-form-actions > label { margin: 0; max-width: 300px; flex: 1; }
.community-form-actions > button { flex: 0 0 auto; }
.community-feedback { color: var(--accent); font-size: .875rem; margin: 16px 0 0; }
.community-feedback:empty { display: none; }
.community-empty { grid-column: 1 / -1; padding: 32px 20px; color: var(--muted); font-size: .875rem; line-height: 1.7; text-align: center; list-style: none; border: 1px dashed var(--line); border-radius: 10px; margin: 0; }
.gallery-heading {
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
  margin-bottom: 26px;
}
.eyebrow { font-size: .75rem; letter-spacing: .09em; color: var(--accent); margin: 0; }
.intro { color: var(--muted); margin: 0; max-width: 680px; font-size: .9375rem; }
.gallery-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.gallery-title-group h1 { font-size: 1.75rem; letter-spacing: 0; margin: 0 0 6px; font-weight: 700; }
.gallery-title-group p { color: var(--muted); font-size: .875rem; margin: 0; }
.gallery-controls-group { max-width: 60%; }
.gallery-controls { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.gallery-controls button { min-height: 38px; padding: 8px 12px; font-size: .8125rem; }
.gallery-controls #gallery-random { background: var(--accent-light); color: var(--accent-hover); border-color: transparent; }
.gallery-controls #gallery-random:hover { border-color: var(--accent); }
.gallery-controls button > span { font-size: 1.1rem; line-height: 1; }
.sort-label { display: flex; align-items: center; flex-direction: row; margin: 0; gap: 8px; }
.sort-label select { width: auto; min-height: 38px; padding: 8px 30px 8px 12px; font-size: .8125rem; background: var(--raised); }
.gallery-status { color: var(--muted); font-size: .75rem; margin: 0 0 8px; text-align: right; }
.gallery-toolbar { margin-bottom: 10px; }
.search { display: flex; flex-direction: row; align-items: center; gap: 10px; margin: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); padding: 0 14px; }
.search svg { flex: 0 0 auto; color: var(--muted); }
.search input { flex: 1; width: 100%; min-width: 0; min-height: 46px; border: 0; background: transparent; padding: 11px 0; font-size: .875rem; outline: none; }
.search kbd { font-family: inherit; font-size: .75rem; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 1px 7px; background: var(--raised); }
.search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.category-bar { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 40px; }
.category-bar button { min-height: 32px; padding: 5px 12px; border-radius: 6px; background: var(--raised); color: var(--muted); font-size: .8125rem; font-weight: 400; border-color: var(--line); }
.category-bar button:hover { color: var(--ink); border-color: var(--line); }
.category-bar button[aria-pressed="true"] { color: #fff; background: var(--accent); border-color: var(--accent); }
.category-bar button > span { font-size: .6875rem; opacity: .75; }
.gallery-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
.work-card { min-width: 0; border: 1px solid var(--line); border-radius: 12px; background: var(--raised); transition: border-color .18s, box-shadow .18s; }
.work-card:hover { border-color: var(--line-hover); box-shadow: 0 8px 24px #00000008; }
.work-card:focus-within { position: relative; z-index: 5; }
.card-stage { height: 240px; display: flex; align-items: center; justify-content: center; position: relative; background: var(--surface); border-radius: 11px 11px 0 0; overflow: hidden; }
.card-stage > [data-preview], .card-stage > .card-preview { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border: 0; padding: 0; background: transparent; }
.card-stage > [data-preview]:hover, .card-stage > .card-preview:hover { background: transparent; text-decoration: none; }
.card-stage img { object-fit: contain; max-width: 84%; max-height: 84%; }
.stat-pill { position: absolute; top: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; font-size: .75rem; min-height: 28px; padding: 4px 9px; border: 1px solid var(--line); border-radius: 999px; background: var(--raised); color: var(--muted); line-height: 1.4; z-index: 1; }
.like-button { left: 12px; }
.like-button:hover { color: #e25577; border-color: #efb5c4; background: var(--raised); }
.like-button[aria-pressed="true"] { color: #e25577; border-color: #efb5c4; background: #fff1f5; }
.download-count { right: 12px; }
.kind-badge { position: absolute; left: 12px; bottom: 12px; font-size: .6875rem; color: var(--muted); background: var(--raised); padding: 3px 7px; border: 1px solid var(--line); border-radius: 5px; }
.plugin-symbol { font-size: 3rem; color: var(--accent); font-weight: 500; }
.card-body { padding: 16px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.card-body h2 { font-size: 1.125rem; font-weight: 600; margin: 0; min-width: 0; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-body h2 a { color: var(--ink); }
.card-body h2 a:hover { color: var(--accent); text-decoration: none; }
.category-pill { flex: 0 0 auto; font-size: .625rem; line-height: 1.4; padding: 3px 6px; border-radius: 4px; background: var(--surface); color: var(--muted); white-space: nowrap; }
.byline { font-size: .75rem; margin: 0 0 8px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.byline a { color: var(--accent); }
.card-body .description { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; font-size: .75rem; line-height: 1.6; color: var(--muted); min-height: 38px; margin-bottom: 14px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 14px; }
.tags span { font-size: .6875rem; color: var(--muted); background: var(--surface); border-radius: 4px; padding: 2px 6px; }
.card-actions { display: flex; align-items: stretch; gap: 8px; }
.card-actions > button, .card-actions > a, .card-actions > .install-menu { flex: 1; min-width: 0; }
.card-actions > button, .card-actions > a { padding: 7px 5px; min-height: 32px; border-radius: 6px; font-size: .75rem; }
.card-actions > .share-menu { flex: 0 0 32px; }
.card-actions details { position: relative; margin: 0; min-width: 0; font-size: .75rem; }
.card-actions summary { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 32px; border: 1px solid var(--line); border-radius: 6px; cursor: pointer; padding: 7px 6px; list-style: none; color: var(--ink); font-size: .75rem; font-weight: 500; line-height: 1.4; }
.card-actions summary::-webkit-details-marker { display: none; }
.card-actions .install-menu summary { background: var(--raised); border-color: var(--line); color: var(--ink); }
.card-actions .install-menu summary:hover { background: var(--surface); border-color: var(--line-hover); }
.card-actions .share-menu summary { padding: 7px; background: var(--raised); }
.card-actions .share-menu summary:hover { background: var(--surface); }
.card-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 10; display: flex; flex-direction: column; gap: 3px; padding: 6px; min-width: 190px; max-width: calc(100vw - 48px); background: var(--raised); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px #00000018; }
.card-menu > a, .card-menu > button { display: block; width: 100%; padding: 9px 10px; border: 0; border-radius: 4px; background: transparent; color: var(--ink); text-align: left; min-height: 36px; font-size: .75rem; white-space: nowrap; }
.card-menu > a:hover, .card-menu > button:hover { background: var(--surface); text-decoration: none; }
.sprite { width: 144px; height: 156px; background-size: 1152px 1716px; background-position: 0 0; background-repeat: no-repeat; flex: 0 0 auto; }
.sprite.large { width: 192px; height: 208px; background-size: 1536px 2288px; }
.gallery-pagination { text-align: center; margin: 24px 0 0; }
.result-count { font-size: .8125rem; color: var(--muted); margin: 0 0 16px; }
.empty { padding: 48px 20px; text-align: center; border: 1px dashed var(--line); border-radius: 12px; color: var(--muted); }
.empty h2 { color: var(--ink); }
.creation-tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--line); margin-bottom: 24px; padding-bottom: 12px; }
.creation-tabs button { background: var(--raised); color: var(--muted); }
.creation-tabs button[aria-selected="true"] { color: var(--accent); background: var(--accent-light); border-color: var(--accent); }
.creator-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); gap: 24px; }
.form-panel, .preview-panel { padding: 26px; background: var(--raised); border: 1px solid var(--line); border-radius: 12px; min-width: 0; }
.form-panel h2, .preview-panel h3 { border-bottom: 1px solid var(--line); padding-bottom: 14px; }
.preview-panel { align-self: start; position: sticky; top: 90px; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
label { display: flex; flex-direction: column; gap: 8px; font-size: .875rem; color: var(--ink); margin-bottom: 18px; }
input, select, textarea { width: 100%; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 11px 12px; min-height: 44px; min-width: 0; }
input::placeholder, textarea::placeholder { color: var(--muted); }
textarea { resize: vertical; }
.hint { color: var(--muted); font-size: .8125rem; overflow-wrap: anywhere; }
.preview-stage { min-height: 270px; margin: 16px 0 24px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 20px; background-color: #fff; background-image: linear-gradient(45deg, #e9e9e4 25%, transparent 25%), linear-gradient(-45deg, #e9e9e4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e9e9e4 75%), linear-gradient(-45deg, transparent 75%, #e9e9e4 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0; }
.preview-stage > p { color: var(--muted); font-size: .875rem; margin: 0; }
.preview-stage[data-background="light"] { background: #fafaf8; }
.preview-stage[data-background="dark"] { background: #30302e; }
.preview-stage[data-background="dark"] > p { color: #d1d1c9; }
.speech-preview { border: 1px solid var(--line); background: var(--raised); padding: 12px 16px; border-radius: 8px; max-width: 90%; overflow-wrap: anywhere; }
.upload-label { padding: 16px; border: 1px dashed var(--accent); border-radius: 8px; background: var(--accent-light); }
.upload-label input { font-size: .8125rem; }
details { margin: 20px 0; color: var(--muted); font-size: .875rem; }
summary { color: var(--ink); cursor: pointer; padding: 8px 0; }
details p { margin: 12px 0; }
.brief-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.feedback { padding: 16px 0; color: var(--accent-hover); overflow-wrap: anywhere; }
.feedback[data-error="true"] { color: #ac3d31; }
.guide-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.guide-grid p { color: var(--muted); font-size: .9375rem; }
.step { font-size: 2rem; display: block; color: var(--accent); margin-bottom: 18px; }
footer { max-width: 1320px; margin: 48px auto 0; padding: 26px 24px; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 24px; color: var(--muted); font-size: .8125rem; }
footer span { font-weight: 700; color: var(--ink); }
footer p { flex: 1; margin: 0; }
dialog { background: var(--raised); color: var(--ink); border: 1px solid var(--line); border-radius: 16px; width: min(1000px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 24px; }
dialog::backdrop { background: #00000073; }
.dialog-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; position: sticky; top: -24px; background: var(--raised); padding: 12px 0; z-index: 2; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.dialog-heading h2 { margin: 0; font-size: 1.25rem; }
.dialog-heading button { flex-shrink: 0; white-space: nowrap; }
.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
.detail-visual, .detail-information { min-width: 0; }
.detail-visual .preview-stage { min-height: 340px; margin: 0 0 20px; }
.detail-information > p { overflow-wrap: anywhere; }
.detail-information .byline { font-size: .8125rem; margin-bottom: 12px; }
.detail-information #detail-description { font-size: .875rem; color: var(--muted); margin-bottom: 20px; }
.dialog-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: .8125rem; }
.action-grid, .look-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 20px; }
.look-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.action-grid button, .look-grid button { background: var(--surface); color: var(--ink); padding: 8px 5px; font-size: .75rem; }
.action-grid button[aria-pressed="true"], .look-grid button[aria-pressed="true"] { background: var(--accent-light); color: var(--accent-hover); border-color: var(--accent); }
.preview-subheading { border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--bg); border-radius: 8px; padding: 12px 18px; max-width: calc(100vw - 32px); z-index: 50; font-size: .875rem; box-shadow: 0 4px 16px #00000020; }
.download-result { margin: 18px 0; overflow-wrap: anywhere; }
.download-result a { max-width: 100%; word-break: break-word; }

@media (min-width: 640px) {
  .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
  .gallery-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .gallery-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 1000px) {
  .site-header { gap: 18px; }
  .site-header nav { gap: 8px 16px; flex-wrap: wrap; }
  .beta { display: none; }
  .home-rankings { grid-template-columns: 1fr; gap: 24px; }
  .home-ranking-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; }
  .home-ranking-heading .home-eyebrow { margin: 0; width: 100%; }
  .home-ranking-heading h2 { flex: 1; }
  .home-ranking-heading .home-scope { width: 100%; order: 4; margin: 0; }
  .home-pet-strip { gap: 14px; }
  .home-pet-card > img { height: 140px; }
  .community-collection-visual { padding-inline: 12px; height: 230px; }
  .community-collection-visual > img { height: 140px; }
  .community-collection-visual > img:nth-child(2), .community-collection-visual > img:nth-child(4) { height: 180px; }
  .community-collection-visual > img:only-child { height: 180px; }
  .home-carousel-control { top: 150px; }
  .community-collection-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .community-request-grid .community-request-card { grid-template-columns: minmax(92px, .3fr) minmax(0, .7fr); }
  .community-request-grid .community-request-body { padding: 16px 12px; }
  .community-request-grid .community-request-actions button { font-size: .6875rem; }
  .guide-grid { grid-template-columns: 1fr; }
  .creator-layout { grid-template-columns: minmax(0, 1fr) minmax(260px, .85fr); }
}
@media (max-width: 767px) {
  #gallery-view { scroll-margin-top: 160px; }
  .site-header { padding: 12px 16px; flex-wrap: wrap; gap: 12px; }
  .site-header nav { order: 4; width: 100%; flex-basis: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 0 20px; }
  .site-header > .theme-toggle { margin-left: auto; }
  .site-header > .compact { padding: 7px 10px; }
  main { padding: 24px 16px 0; }
  .home-hero { margin-inline: -16px; padding: 40px 16px 32px; }
  .home-title { font-size: clamp(2.4rem, 6vw, 3.25rem); letter-spacing: -.03em; }
  .home-description { font-size: 1rem; max-width: 560px; }
  .home-stats { gap: 12px; margin-top: 32px; }
  .home-stat { padding: 16px 8px; border-radius: 12px; }
  .home-stat > strong { font-size: 1.875rem; }
  .home-pet-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 560px; margin-top: 40px; gap: 14px; }
  .home-pet-card > img { height: 148px; }
  .home-section { padding: 32px 0; }
  .home-section h2 { font-size: 1.25rem; }
  .home-section-heading { gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .home-ranking-columns { gap: 18px; }
  .community-ranking-row { gap: 8px; }
  .community-rank-work { gap: 8px; font-size: .8125rem; }
  .community-rank-value { font-size: .6875rem; }
  .home-collection-strip { grid-template-columns: repeat(3, minmax(280px, 1fr)); overflow-x: auto; gap: 14px; padding-bottom: 8px; overscroll-behavior-x: contain; scrollbar-width: thin; }
  .community-collection-visual { height: 230px; }
  .community-collection-body { padding: 16px; }
  .community-request-grid { grid-template-columns: 1fr; gap: 16px; }
  .community-request-grid .community-request-body { padding: 18px 16px; }
  .community-request-grid .community-request-actions button { font-size: .8125rem; }
  .community-page-heading h1 { font-size: 1.75rem; }
  .community-toolbar { gap: 12px; }
  .community-toolbar .community-search { flex-basis: 100%; min-width: 0; }
  .community-request-form { padding: 20px; }
  .community-form-actions { flex-wrap: wrap; }
  .community-form-actions > label { flex-basis: 100%; max-width: none; }
  .community-form-actions > button { width: 100%; }
  .community-ranking-page-list { padding: 8px 16px; }
  .gallery-header { align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
  .gallery-controls-group { max-width: none; }
  .gallery-controls { margin-left: auto; }
  .gallery-status { margin-bottom: 8px; }
  .category-bar { gap: 7px; margin-bottom: 20px; }
  .gallery-heading { align-items: flex-start; flex-direction: column; gap: 16px; }
  .creator-layout { grid-template-columns: 1fr; }
  .preview-panel { position: static; grid-row: 1; }
  .field-grid { grid-template-columns: 1fr; gap: 0; }
  .form-panel, .preview-panel { padding: 20px; }
  .preview-stage { min-height: 220px; }
  .guide-grid { gap: 16px; }
  .detail-layout { grid-template-columns: 1fr; gap: 12px; }
  .detail-visual .preview-stage { min-height: 270px; }
  footer { padding: 24px 16px; flex-wrap: wrap; gap: 12px; }
  footer p { flex-basis: 100%; order: 3; }
  .dialog-actions { align-items: flex-start; flex-direction: column; gap: 16px; }
  .look-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  h1 { letter-spacing: 0; }
}
@media (max-width: 639px) {
  .home-badge { font-size: .75rem; padding: 6px 10px; margin-bottom: 24px; }
  .home-title { font-size: clamp(2rem, 7.8vw, 2.75rem); }
  .home-description { font-size: .875rem; line-height: 1.8; }
  .home-stats { gap: 8px; }
  .home-stat { padding: 14px 5px; }
  .home-stat > strong { font-size: 1.5rem; }
  .home-stat > span { font-size: .625rem; }
  .home-pet-strip { gap: 10px; }
  .home-pet-card { padding: 10px 5px; }
  .home-pet-card > img { height: 116px; }
  .home-pet-card > span { font-size: .625rem; }
  .home-ranking-columns { grid-template-columns: 1fr; gap: 24px; }
  .home-request-strip { grid-template-columns: repeat(4, minmax(300px, 1fr)); gap: 12px; }
  .home-section-link { font-size: .8125rem; }
  .community-collection-grid { grid-template-columns: 1fr; gap: 16px; }
  .community-collection-visual { height: 250px; }
  .community-collection-visual > img:only-child { height: 200px; }
  .community-ranking-page-list .community-rank-work { font-size: .875rem; }
  .community-ranking-page-list .community-rank-value { font-size: .6875rem; }
  .community-request-grid .community-request-card { grid-template-columns: minmax(82px, .27fr) minmax(0, .73fr); }
  .community-request-grid .community-request-body { padding: 16px 12px; }
  .community-request-grid .community-request-title { font-size: 1rem; }
  .community-request-grid .community-request-actions button { font-size: .6875rem; }
  .gallery-grid { gap: 16px; }
  .gallery-controls-group { width: 100%; }
  .gallery-status { text-align: left; }
  .gallery-controls { width: 100%; justify-content: space-between; margin-left: 0; }
  .card-stage { height: 240px; }
  .card-menu { min-width: 180px; }
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; scroll-behavior: auto !important; }
}
.creator-mode-tabs { margin: 0 0 24px; }
.creator-layout:has(#pet-import-fields:not([hidden])) { grid-template-columns: minmax(0, 1fr); }
.creator-submit-actions, .package-upload-options { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px; }
.package-upload-options .upload-label { flex: 1 1 190px; margin: 0; min-width: 0; }
.package-upload-options input { width: 100%; }
.creator-clips { display: grid; gap: 14px; margin: 18px 0; }
.creator-clip { padding: 18px; border: 1px solid var(--line, #d8e4df); border-radius: 14px; background: var(--surface, #fff); }
.creator-clip .hint { overflow-wrap: anywhere; margin-top: 0; }
.creator-clip .creator-submit-actions { margin-top: 8px; }
.creator-media-preview { width: 100%; height: 100%; max-height: 320px; object-fit: contain; }
.package-file-list { max-height: 330px; padding-left: 20px; overflow: auto; overflow-wrap: anywhere; font-size: 13px; line-height: 1.8; }
.creator-publishing-note { margin: 24px 0 0; }
.community-rank-symbol { display: grid; place-items: center; flex: 0 0 48px; height: 52px; border-radius: 12px; color: var(--accent); background: var(--surface); font-size: 24px; }
.creation-tabs { flex-wrap: wrap; }
.creation-tabs a[aria-current="page"] { color: var(--accent); background: var(--accent-light); border-color: var(--accent); }
.plugin-cover { width: 100%; height: 100%; object-fit: cover; }
#plugin-card-preview .work-card { margin-top: 14px; }
#plugin-card-preview .card-stage { height: 200px; }
#plugin-card-preview .description { white-space: normal; }
.compatibility-report { margin-top: 18px; padding: 18px; border: 1px solid var(--line); border-radius: 10px; background: var(--accent-light); }
.compatibility-report h3 { margin: 6px 0; }
.compatibility-report[data-level="invalid"], .compatibility-report[data-level="external"] { background: var(--surface); }
.compatibility-report li { margin: 8px 0; overflow-wrap: anywhere; }
.import-capabilities { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.import-capabilities .hint { flex-basis: 100%; }
.binding-field button { margin-top: 8px; font-size: 12px; }
button:disabled { opacity: .5; cursor: not-allowed; }
#create-view[data-workflow="plugin-import"] .preview-panel { grid-row: auto; }
.plugin-publication-panel { margin-bottom: 24px; }
.plugin-publication-panel .button { margin: 0 8px 8px 0; }
`,type:"text/css; charset=utf-8"},"/app.js":{body:`import { attribution, petManifest, zipPackage, safePackagePath, readZipPackage, normalizePackageFiles, inspectImportPackage, videoPetManifest, coverImageType, prepareWorkPackage, creationImageChecks, packageWorkFields, petStateIds } from './package-core.js';
import { actions, templates, templateCredit, pets, petDisplayAuthor, toolPlugins, projectAuthor, projectAuthorUrl } from './catalog.js';
import { contributorHref } from './community-core.js';
import { sourcePlugins } from './plugin-catalog.js';
import { pluginCovers } from './plugin-covers.js';
import { createCommunityPages } from './community-pages.js';
import { createPluginPublicationClient, configuredSubmissionRepository, githubSubmissionUrl } from './publication-client.js';
import { publicSiteUrl, submissionRepository } from './publication-config.js';

const $ = selector => document.querySelector(selector);
const works = [...pets, ...toolPlugins, ...sourcePlugins, ...templates.map(item => ({ ...item, kind: 'plugin', author: templateCredit.author, download: \`assets/\${item.id}.zip\` }))].map(item => ({ ...item, ...(item.kind === 'plugin' ? { cover: pluginCovers[item.id] ?? item.cover ?? item.presentation?.cover } : {}), ...(item.author === projectAuthor ? { authorHandle: projectAuthor, authorUrl: projectAuthorUrl } : {}) }));
const pluginWorks = works.filter(item => item.kind === 'plugin');
const petWorks = works.filter(item => item.kind === 'pet');
const publication = createPluginPublicationClient();
let publicationSession = null;
let publicationBusy = false;
let publicListLoaded = false;
let sharedActivity = null;
let sharedContributorFollowers = null;
let activitySnapshotAt = new Date().toISOString();
const likePending = new Set();
const galleryCategories = ['\u6E38\u620F\u89D2\u8272', '\u52A8\u6F2B\u89D2\u8272', '\u5409\u7965\u7269', '\u5176\u4ED6', '\u673A\u5668\u4EBA', '\u539F\u521B\u89D2\u8272', '\u4EBA\u7269\u5934\u50CF', '\u52A8\u7269\u4F19\u4F34', '\u5E7B\u60F3\u751F\u7269', '\u7F51\u7EDC\u6897\u56FE', '\u7269\u4EF6\u4E0E\u9053\u5177'];
const galleryPageSize = 18;
const activityKey = 'pet-community-gallery-activity-v1';
const themeKey = 'pet-community-theme';
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
let storageAvailable = true;
let galleryActivity = readGalleryActivity();
let shuffledIds = shuffle(works.map(item => item.id));
let visibleLimit = galleryPageSize;
let detailWork;
let route = 'pets';
let category = '\u5168\u90E8';
let selectedAtlas;
let atlasGeneration = 0;
let activeAnimations = [];
let toastTimer;
let packageUrl;
const lookDirections = { 0: '\u5411\u4E0A', 4: '\u5411\u53F3', 8: '\u5411\u4E0B', 12: '\u5411\u5DE6' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function icon(name) {
  const paths = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
  };
  return \`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${paths[name]}</svg>\`;
}

function shuffle(ids) {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function readGalleryActivity() {
  try {
    const input = JSON.parse(localStorage.getItem(activityKey) ?? '{}');
    const result = {};
    for (const item of works) {
      const entry = input?.[item.id];
      if (!entry || typeof entry !== 'object') continue;
      result[item.id] = {
        liked: entry.liked === true,
        downloads: Number.isSafeInteger(entry.downloads) && entry.downloads >= 0 ? entry.downloads : 0,
        recent: Array.isArray(entry.recent) ? entry.recent.filter(time => Number.isFinite(time) && time > Date.now() - weekMilliseconds && time <= Date.now()).slice(-2000) : [],
      };
    }
    return result;
  } catch {
    storageAvailable = false;
    return {};
  }
}

function activityFor(id) {
  if (publicationSession?.interactionsAvailable) return sharedActivity?.[id] ?? { liked: false, likes: 0, downloads: 0, weekly: 0, scope: 'site', recent: [] };
  return galleryActivity[id] ?? { liked: false, downloads: 0, recent: [] };
}

async function recordActivity(id, kind) {
  if (publicationSession?.interactionsAvailable) {
    if (kind !== 'like' || likePending.has(id)) return;
    if (!publicationSession.anonymousInteractions && !publicationSession.signedIn) { toast('\u4E92\u52A8\u670D\u52A1\u6682\u4E0D\u53EF\u7528\u3002'); return; }
    if (!sharedActivity) { toast('\u516C\u5171\u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\u3002'); return; }
    likePending.add(id);
    try { sharedActivity = await publication.like(id, !activityFor(id).liked); activitySnapshotAt = new Date().toISOString(); updateActivityDisplay(id); communityPages.refresh(); }
    catch (error) { toast(error.message); }
    finally { likePending.delete(id); }
    return;
  }
  const entry = activityFor(id);
  const now = Date.now();
  if (kind === 'like') entry.liked = !entry.liked;
  else entry.downloads++;
  entry.recent = entry.recent.filter(time => time > now - weekMilliseconds);
  if (kind === 'download' || entry.liked) entry.recent.push(now);
  entry.recent = entry.recent.slice(-2000);
  galleryActivity[id] = entry;
  activitySnapshotAt = new Date().toISOString();
  try {
    localStorage.setItem(activityKey, JSON.stringify(galleryActivity));
  } catch {
    storageAvailable = false;
  }
  updateActivityDisplay(id);
  communityPages.refresh();
}

function updateActivityDisplay(id) {
  const entry = activityFor(id);
  document.querySelectorAll('[data-like]').forEach(button => {
    if (button.dataset.like !== id) return;
    button.setAttribute('aria-pressed', String(entry.liked));
    button.setAttribute('aria-label', \`\${entry.liked ? '\u53D6\u6D88\u70B9\u8D5E' : '\u70B9\u8D5E'}\${entry.scope === 'site' ? '' : ' \xB7 \u4EC5\u6B64\u6D4F\u89C8\u5668'}\`);
    button.innerHTML = \`\${icon('heart')}<span>\${entry.likes ?? Number(entry.liked)}</span>\`;
  });
  document.querySelectorAll('[data-download-count]').forEach(counter => {
    if (counter.dataset.downloadCount !== id) return;
    counter.innerHTML = \`\${icon('download')}<span>\${entry.downloads}</span>\`;
    counter.title = entry.scope === 'site' ? '\u5168\u7AD9\u4E0B\u8F7D\uFF0C\u540C\u4E00\u533F\u540D\u6765\u6E90\u6BCF\u65E5\u53BB\u91CD' : \`\u6B64\u6D4F\u89C8\u5668\u53D1\u8D77 \${entry.downloads} \u6B21\u4E0B\u8F7D\`;
  });
  $('#gallery-status').textContent = publicationSession?.interactionsAvailable ? sharedActivity ? '\u5168\u7AD9\u70B9\u8D5E\u4E0E\u4E0B\u8F7D \xB7 \u540C\u4E00\u533F\u540D\u6765\u6E90\u6BCF\u5929\u53BB\u91CD' : '\u516C\u5171\u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5' : storageAvailable ? '\u70B9\u8D5E\u4E0E\u4E0B\u8F7D\u6B21\u6570\u8BB0\u5F55\u4E8E\u6B64\u6D4F\u89C8\u5668 \xB7 \u8FD1\u671F\u8D8B\u52BF\u4E3A\u8FD1 7 \u65E5\u4E92\u52A8' : '\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u4FDD\u5B58\uFF0C\u70B9\u8D5E\u4E0E\u4E0B\u8F7D\u6B21\u6570\u4EC5\u5728\u5F53\u524D\u9875\u9762\u4FDD\u7559';
}

function filteredWorks() {
  const kind = route === 'plugins' ? 'plugin' : 'pet';
  const query = $('#search').value.trim().toLocaleLowerCase();
  const matches = works.filter(item => item.kind === kind && (category === '\u5168\u90E8' || item.category === category)
    && \`\${item.title} \${item.author} \${item.description} \${item.category} \${(item.tags ?? []).join(' ')}\`.toLocaleLowerCase().includes(query));
  const order = $('#sort').value;
  return matches.sort((a, b) => {
    if (order === 'name') return a.title.localeCompare(b.title, 'zh-CN');
    if (order === 'downloads') return activityFor(b.id).downloads - activityFor(a.id).downloads;
    if (order === 'likes') return (activityFor(b.id).likes ?? Number(activityFor(b.id).liked)) - (activityFor(a.id).likes ?? Number(activityFor(a.id).liked));
    if (order === 'trending') {
      const since = Date.now() - weekMilliseconds;
      return (activityFor(b.id).weekly ?? activityFor(b.id).recent.filter(time => time > since).length) - (activityFor(a.id).weekly ?? activityFor(a.id).recent.filter(time => time > since).length);
    }
    return shuffledIds.indexOf(a.id) - shuffledIds.indexOf(b.id);
  });
}

function renderCard(item, previewOnly = false) {
  const pet = item.kind === 'pet';
  const entry = activityFor(item.id);
  const author = escapeHtml(pet ? petDisplayAuthor(item) : item.author);
  const preview = pet
    ? \`<a href="#pets/\${item.id}" class="card-preview" data-preview="\${item.id}" aria-label="\u67E5\u770B \${escapeHtml(item.title)}"><img src="\${escapeHtml(item.thumbnail)}" alt="\${escapeHtml(item.title)} \u9884\u89C8" loading="lazy" width="192" height="208"></a>\`
    : item.cover || item.presentation?.cover ? \`<img class="plugin-cover" src="\${escapeHtml(item.cover || item.presentation.cover)}" alt="\${escapeHtml(item.title)} \u5C01\u9762" loading="lazy">\` : \`<span class="plugin-symbol" aria-hidden="true">\${escapeHtml(item.symbol || '\u2726')}</span>\`;
  const previewHref = pet ? \`#pets/\${item.id}\` : \`#plugins/\${item.id}\`;
  return \`<article class="work-card" data-work="\${item.id}">
    <div class="card-stage \${pet ? '' : 'plugin-stage'}">
      \${preview}
      \${previewOnly ? '' : \`<button type="button" class="stat-pill like-button" data-like="\${item.id}" aria-pressed="\${entry.liked}" aria-label="\${entry.liked ? '\u53D6\u6D88\u70B9\u8D5E' : '\u70B9\u8D5E'}">\${icon('heart')}<span>\${entry.likes ?? Number(entry.liked)}</span></button><span class="stat-pill download-count" data-download-count="\${item.id}" title="\${entry.scope === 'site' ? '\u5168\u7AD9\u4E0B\u8F7D\uFF0C\u6BCF\u65E5\u53BB\u91CD' : '\u6B64\u6D4F\u89C8\u5668\u53D1\u8D77\u4E0B\u8F7D'}">\${icon('download')}<span>\${entry.downloads}</span></span>\`}
    </div>
    <div class="card-body">
      <div class="card-title-row"><h2>\${previewOnly ? escapeHtml(item.title) : \`<a href="\${previewHref}" data-preview="\${item.id}">\${escapeHtml(item.title)}</a>\`}</h2><span class="category-pill">\${escapeHtml(item.category)}</span></div>
      <p class="byline">\${item.authorRole === 'maintainer' ? '\u7EF4\u62A4\u8005' : '\u4F5C\u8005'} <a href="\${escapeHtml(contributorHref(item.author, pet ? 'pets' : 'plugins'))}">\${author}</a></p>
      <p class="description" title="\${escapeHtml(item.description)}">\${escapeHtml(item.description)}</p>
      \${previewOnly ? '<p class="hint">\u5361\u7247\u9884\u89C8\uFF0C\u53D1\u5E03\u7ED3\u679C\u4EE5\u4E0B\u65B9\u53CD\u9988\u4E3A\u51C6</p>' : \`<div class="card-actions">
        <a class="button secondary" href="\${previewHref}" data-preview="\${item.id}">\${pet ? '\u67E5\u770B' : '\u67E5\u770B\u529F\u80FD'}</a>
        <details class="install-menu"><summary aria-label="\u5B89\u88C5 \${escapeHtml(item.title)}">\${icon('download')}\u5B89\u88C5 \${icon('chevron')}</summary><div class="card-menu">
          <a href="\${escapeHtml(item.download)}" download data-download="\${item.id}">\u4E0B\u8F7D \${pet ? '\u684C\u5BA0' : '\u63D2\u4EF6'} ZIP</a>
          <button type="button" data-install-help="\${item.id}">\u590D\u5236\u7ED9 AI \u7684\u5B89\u88C5\u8BF4\u660E</button>
          <a href="#guide">\u9605\u8BFB\u5B89\u88C5\u6307\u5357</a>
        </div></details>
        <details class="share-menu"><summary aria-label="\u5206\u4EAB \${escapeHtml(item.title)}">\${icon('share')}</summary><div class="card-menu">
          <button type="button" data-share="\${item.id}">\u590D\u5236\u4F5C\u54C1\u94FE\u63A5</button>
        </div></details>
      </div>\`}
    </div>
  </article>\`;
}

function animateSprite(element, action, version = 2) {
  const [, row, frames, duration] = action;
  const width = element.classList.contains('large') ? 192 : 144;
  const height = width * 208 / 192;
  element.getAnimations().forEach(animation => animation.cancel());
  element.style.backgroundSize = \`\${width * 8}px \${height * (version === 2 ? 11 : 9)}px\`;
  element.style.backgroundPosition = \`0px \${-row * height}px\`;
  element.style.animation = 'none';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const animation = element.animate([
      { backgroundPositionX: '0px' }, { backgroundPositionX: \`\${-frames * width}px\` },
    ], { duration, iterations: Infinity, easing: \`steps(\${frames})\` });
    activeAnimations = activeAnimations.filter(item => item.playState !== 'idle');
    activeAnimations.push(animation);
  }
}

function updatePreview(prefix, mode, index) {
  const sprite = $(\`#\${prefix}-pet-stage .sprite\`);
  if (!sprite || (prefix === 'creator' && !selectedAtlas)) return;
  const version = prefix === 'creator' ? selectedAtlas.version : detailWork?.version ?? 2;
  let label;
  if (mode === 'look') {
    if (version !== 2) return;
    $(\`#\${prefix}-action\`).value = '';
    sprite.getAnimations().forEach(animation => animation.cancel());
    const width = sprite.classList.contains('large') ? 192 : 144;
    const height = width * 208 / 192;
    sprite.style.backgroundSize = \`\${width * 8}px \${height * 11}px\`;
    sprite.style.backgroundPosition = \`\${-(index % 8) * width}px \${-(9 + Math.floor(index / 8)) * height}px\`;
    label = \`\u6CE8\u89C6 \${index * 22.5}\xB0\${lookDirections[index] ? \` \xB7 \${lookDirections[index]}\` : ''}\`;
  } else {
    $(\`#\${prefix}-action\`).value = String(index);
    animateSprite(sprite, actions[index], version);
    label = actions[index][0];
  }
  $(\`#\${prefix}-action-buttons\`).querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(mode === 'action' && Number(button.dataset.previewAction) === index));
  });
  $(\`#\${prefix}-look-buttons\`).querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(mode === 'look' && Number(button.dataset.previewLook) === index));
  });
  $(\`#\${prefix}-current-preview\`).textContent = \`\u6B63\u5728\u9884\u89C8\uFF1A\${label}\`;
  sprite.setAttribute('aria-label', \`\u684C\u5BA0\u9884\u89C8\uFF1A\${label}\`);
}

function updateCreatorControls() {
  $('#creator-action').disabled = !selectedAtlas;
  $('#creator-action-buttons').querySelectorAll('button').forEach(button => { button.disabled = !selectedAtlas; });
  $('#creator-look-section').hidden = selectedAtlas?.version !== 2;
  if (!selectedAtlas) $('#creator-current-preview').textContent = '\u9009\u62E9\u56FE\u96C6\u540E\u5373\u53EF\u9884\u89C8';
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6000);
}

function download(blob, name) {
  if (packageUrl) URL.revokeObjectURL(packageUrl);
  packageUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = packageUrl;
  anchor.download = name;
  anchor.className = 'button secondary';
  anchor.textContent = \`\u4FDD\u5B58 \${name}\`;
  let result = document.querySelector('#download-result');
  if (!result) {
    result = document.createElement('div');
    result.id = 'download-result';
    result.className = 'download-result';
  }
  result.replaceChildren(anchor);
  const destination = $('#pet-detail').open ? $('#pet-detail') : route === 'create' ? $('#creator-feedback').parentElement : route === 'requests' ? $('#request-feedback').parentElement : $('#result-count').parentElement;
  destination.append(result);
  anchor.click();
}

function renderGallery() {
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations = [];
  const kind = route === 'plugins' ? 'plugin' : 'pet';
  $('#search').placeholder = kind === 'plugin' ? '\u641C\u7D22\u63D2\u4EF6\u3001\u4F5C\u8005\u3001\u6807\u7B7E\u2026' : '\u641C\u7D22\u684C\u5BA0\u3001\u4F5C\u8005\u3001\u6807\u7B7E\u2026';
  $('#search').setAttribute('aria-label', kind === 'plugin' ? '\u641C\u7D22\u63D2\u4EF6' : '\u641C\u7D22\u684C\u5BA0');
  const all = works.filter(item => item.kind === kind);
  const matches = filteredWorks();
  const displayed = matches.slice(0, visibleLimit);
  $('#gallery-title').textContent = kind === 'pet' ? '\u684C\u5BA0\u5E7F\u573A' : '\u63D2\u4EF6\u5E7F\u573A';
  $('#catalog-title').textContent = kind === 'pet' ? '\u684C\u5BA0\u4F5C\u54C1' : '\u63D2\u4EF6\u4F5C\u54C1';
  $('#gallery-total').textContent = kind === 'pet' ? \`\u5171 \${all.length} \u53EA\u5BA0\u7269\` : \`\u5171 \${all.length} \u4E2A\u63D2\u4EF6\`;
  const categories = ['\u5168\u90E8', ...(kind === 'pet' ? galleryCategories : new Set(all.map(item => item.category)))];
  $('.category-bar').innerHTML = categories.map(item => {
    const count = all.filter(work => item === '\u5168\u90E8' || work.category === item).length;
    return \`<button type="button" aria-pressed="\${item === category}" data-category="\${escapeHtml(item)}">\${item === '\u5168\u90E8' ? '\u5168\u90E8\u5206\u7C7B' : escapeHtml(item)}\${item === '\u5168\u90E8' ? '' : \`<span>\${count}</span>\`}</button>\`;
  }).join('');
  $('#result-count').textContent = \`\u5DF2\u5C55\u793A \${displayed.length}\${kind === 'pet' ? ' \u53EA\u5BA0\u7269' : ' \u4E2A\u63D2\u4EF6'}\${matches.length === all.length ? '' : \` \xB7 \u5339\u914D \${matches.length} \u4E2A\u4F5C\u54C1\`}\`;
  $('#cards').innerHTML = displayed.map(item => renderCard(item)).join('');
  $('#empty').hidden = matches.length > 0;
  $('#gallery-more').hidden = visibleLimit >= matches.length;
  $('#gallery-more').textContent = \`\u52A0\u8F7D\u66F4\u591A\uFF08\u5269\u4F59 \${Math.max(0, matches.length - visibleLimit)}\uFF09\`;
  updateActivityDisplay('');
}

function renderRoute() {
  const [value, id, contributor] = location.hash.slice(1).split('/');
  const previous = route;
  route = ['pets', 'plugins', 'create', 'guide', 'rankings', 'requests', 'collections', 'contributors'].includes(value) ? value : 'pets';
  if (route !== previous) {
    category = '\u5168\u90E8';
    visibleLimit = galleryPageSize;
    $('#search').value = '';
    window.scrollTo(0, 0);
  }
  if (route !== 'pets' || !id) $('#pet-detail').close();
  if (route !== 'pets' || !id) $('#public-pet-detail')?.close();
  if (route !== 'plugins' || !id) $('#tool-detail')?.close();
  $('#community-home').hidden = route !== 'pets';
  $('#plugin-rankings').hidden = route !== 'plugins';
  $('#gallery-view').hidden = !['pets', 'plugins'].includes(route);
  $('#create-view').hidden = route !== 'create';
  if (route === 'create') showCreator(id);
  if (route !== 'create') { $('#creator-pet-stage video')?.pause(); clearImportPreview(); }
  $('#guide-view').hidden = route !== 'guide';
  for (const name of ['rankings', 'requests', 'collections', 'contributors']) $(\`#\${name}-view\`).hidden = route !== name;
  document.querySelectorAll('[data-route]').forEach(link => {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if ((route === 'pets' || route === 'plugins') && (!id || previous !== route || !$('#cards').hasChildNodes())) renderGallery();
  communityPages.render(route, id, contributor);
  const titles = { pets: '\u684C\u5BA0\u5E7F\u573A', plugins: '\u63D2\u4EF6\u5E7F\u573A', create: '\u5171\u521B\u5DE5\u4F5C\u53F0', guide: '\u5B89\u88C5\u6307\u5357', rankings: '\u793E\u533A\u6392\u884C\u699C', requests: '\u5236\u4F5C\u9700\u6C42\u5E7F\u573A', collections: '\u7CBE\u9009\u5408\u96C6', contributors: '\u793E\u533A\u521B\u4F5C\u8005' };
  document.title = \`\${titles[route]} \xB7 desktop pet\`;
  if (route === 'pets' && id) {
    const work = petWorks.find(item => item.id === id);
    if (work) openPetDetail(work);
    else if (!id.startsWith('community-') || publicListLoaded) toast('\u6B64\u4F5C\u54C1\u4E0D\u5B58\u5728\uFF0C\u8BF7\u4ECE\u5E7F\u573A\u91CD\u65B0\u9009\u62E9\u3002');
  }
  if (route === 'plugins' && id) {
    const tool = works.filter(item => item.kind === 'plugin').find(item => item.id === id);
    if (tool) openPluginCreator(tool);
    else if (!id.startsWith('community-') || publicListLoaded) toast('\u6B64\u5DE5\u5177\u4E0D\u5B58\u5728\uFF0C\u8BF7\u4ECE\u63D2\u4EF6\u5E7F\u573A\u91CD\u65B0\u9009\u62E9\u3002');
  }
}

function openToolDetail(tool) {
  let dialog = $('#tool-detail');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'tool-detail';
    dialog.setAttribute('aria-labelledby', 'tool-detail-title');
    dialog.addEventListener('close', () => {
      if (location.hash.startsWith('#plugins/')) history.replaceState(null, '', '#plugins');
    });
    document.body.append(dialog);
  }
  dialog.innerHTML = \`<div class="dialog-heading"><h2 id="tool-detail-title">\${escapeHtml(tool.title)}</h2><button type="button" class="secondary" aria-label="\u5173\u95ED\u5DE5\u5177\u8BE6\u60C5">\u5173\u95ED</button></div>
    \${tool.cover || tool.presentation?.cover ? \`<div class="card-stage"><img class="plugin-cover" src="\${escapeHtml(tool.cover || tool.presentation.cover)}" alt="\${escapeHtml(tool.title)} \u5C01\u9762"></div>\` : ''}
    <p>\${escapeHtml(tool.description)}</p>
    \${tool.features.length ? \`<h3>\u63D0\u4F9B\u7684\u529F\u80FD</h3><ul>\${tool.features.map(feature => \`<li>\${escapeHtml(feature)}</li>\`).join('')}</ul>\` : ''}
    \${tool.hostNotice ? \`<p>\${escapeHtml(tool.hostNotice)}</p>\` : ''}
    <p>\u4F5C\u8005\uFF1A\${escapeHtml(tool.author)}\${tool.version ? \` \xB7 V\${escapeHtml(tool.version)}\` : ''}<br>\u8BB8\u53EF\uFF1A\${escapeHtml(tool.license)}</p>
    <div class="dialog-actions"><a class="button primary" href="\${escapeHtml(tool.download)}" download data-download="\${tool.id}">\u4E0B\u8F7D\u63D2\u4EF6 ZIP</a><a href="#guide">\u67E5\u770B\u5B89\u88C5\u6307\u5357</a></div>\`;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.querySelector('a[href="#guide"]').addEventListener('click', () => dialog.close());
  if (!dialog.open) dialog.showModal();
}

function openPetDetail(work) {
  if (work.id.startsWith('community-') && !work.atlas) { openPublicMediaPet(work); return; }
  detailWork = work;
  $('#detail-title').textContent = \`\${work.title} \xB7 \u52A8\u4F5C\u9884\u89C8\`;
  $('#detail-description').textContent = work.description;
  $('#detail-author').textContent = \`\u4F5C\u8005\uFF1A\${petDisplayAuthor(work)} \xB7 V\${work.version} \xB7 \${work.category}\`;
  $('#detail-download').href = work.download;
  $('#detail-download').dataset.download = work.id;
  $('#detail-sprite').style.backgroundImage = \`url("\${work.atlas}")\`;
  $('#detail-look-section').hidden = work.version !== 2;
  $('#pet-detail').showModal();
  updatePreview('detail', 'action', 0);
}

function openPublicMediaPet(work) {
  let dialog = $('#public-pet-detail');
  if (!dialog) { dialog = document.createElement('dialog'); dialog.id = 'public-pet-detail'; dialog.setAttribute('aria-labelledby', 'public-pet-title'); dialog.addEventListener('close', () => { if (location.hash.startsWith('#pets/')) history.replaceState(null, '', '#pets'); }); document.body.append(dialog); }
  dialog.querySelectorAll('video').forEach(video => video.pause());
  const entries = Object.entries(work.mediaActions || {});
  dialog.innerHTML = \`<div class="dialog-heading"><h2 id="public-pet-title">\${escapeHtml(work.title)}</h2><button class="secondary" type="button" aria-label="\u5173\u95ED\u684C\u5BA0\u8BE6\u60C5">\u5173\u95ED</button></div><p>\${escapeHtml(work.description)}</p><div class="preview-stage" data-public-media></div>\${entries.length ? \`<label>\u9884\u89C8\u52A8\u4F5C<select data-public-action>\${entries.map(([id, entry]) => \`<option value="\${escapeHtml(id)}">\${escapeHtml(entry.displayName)}</option>\`).join('')}</select></label>\` : \`<p>\${escapeHtml(work.hostNotice)}</p>\`}<p>\u4F5C\u8005\uFF1A\${escapeHtml(work.author)}</p><a class="button primary" href="\${escapeHtml(work.download)}" download data-download="\${work.id}">\u4E0B\u8F7D\u684C\u5BA0 ZIP</a>\`;
  const preview = () => {
    const entry = work.mediaActions[dialog.querySelector('select')?.value];
    const stage = dialog.querySelector('[data-public-media]'); stage.replaceChildren();
    if (!entry) return;
    const media = document.createElement(entry.type.startsWith('video/') ? 'video' : 'img'); media.src = entry.url; media.style.maxHeight = '300px'; media.style.maxWidth = '100%';
    if (media instanceof HTMLVideoElement) { media.muted = true; media.loop = true; media.autoplay = true; media.controls = true; }
    stage.append(media);
  };
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.querySelector('select')?.addEventListener('change', preview);
  dialog.addEventListener('close', () => dialog.querySelectorAll('video').forEach(video => video.pause()), { once: true });
  if (!dialog.open) dialog.showModal(); preview();
}

function resetGallery() {
  visibleLimit = galleryPageSize;
  renderGallery();
}

function closeCardMenus() {
  $('#cards').querySelectorAll('details[open]').forEach(menu => { menu.open = false; });
}

async function copyGalleryText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast('\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u590D\u5236\uFF0C\u8BF7\u4F7F\u7528\u4E0B\u8F7D\u6309\u94AE\u6216\u5B89\u88C5\u6307\u5357\u3002');
  }
}

function showCreator(workflow) {
  const titles = { 'pet-make': '\u5236\u4F5C\u684C\u5BA0', 'plugin-make': '\u5236\u4F5C\u63D2\u4EF6', 'pet-import': '\u5BFC\u5165\u684C\u5BA0', 'plugin-import': '\u5BFC\u5165\u63D2\u4EF6' };
  const next = Object.hasOwn(titles, workflow) ? workflow : null;
  if (next !== creatorWorkflow) {
    $('#creator-submission-link').hidden = true;
    $('#creator-submission-link').removeAttribute('href');
    if (creatorWorkflow) sessionDrafts.set(creatorWorkflow, captureDraft(creatorWorkflow.split('-')[0]));
    clearImportPreview();
    creatorWorkflow = next;
    if (next) applyDraft(next.split('-')[0], sessionDrafts.get(next) || { fields: {}, imported: null });
  }
  document.querySelectorAll('[data-creator-route]').forEach(link => {
    if (link.dataset.creatorRoute === next) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  $('#creator-start').hidden = Boolean(next);
  $('#create-view').dataset.workflow = next || '';
  $('#creator-workflow-title').hidden = !next;
  $('#creator-workflow-title').textContent = titles[next] || '';
  $('#pet-form-panel').hidden = !next?.startsWith('pet-');
  $('#plugin-form-panel').hidden = !next?.startsWith('plugin-');
  if (next?.startsWith('pet-')) setPetMode(next.endsWith('import') ? 'import' : 'make');
  if (next?.startsWith('plugin-')) {
    const importing = next.endsWith('import');
    $('#plugin-upload-title').textContent = importing ? '\u5148\u5BFC\u5165\u539F\u9879\u76EE\u6587\u4EF6' : '\u4E0A\u4F20\u4F60\u5236\u4F5C\u7684\u63D2\u4EF6';
    renderPluginCardPreview();
  }
  updatePublicationUI();
  $('#creator-feedback').textContent = '';
  if (!next?.startsWith('pet-')) $('#creator-pet-stage video')?.pause();
}

async function selectAtlas() {
  const generation = ++atlasGeneration;
  if (selectedAtlas) URL.revokeObjectURL(selectedAtlas.url);
  selectedAtlas = undefined;
  updateCreatorControls();
  $('#creator-pet-stage').replaceChildren();
  $('#atlas-status').textContent = '\u6B63\u5728\u68C0\u67E5\u56FE\u96C6\u2026';
  const file = $('#atlas-input').files[0];
  let url;
  try {
    if (!file) throw new Error('\u7B49\u5F85\u9009\u62E9\u56FE\u96C6');
    if (file.size > 24 * 1024 * 1024) throw new Error('\u56FE\u96C6\u8D85\u8FC7 24 MB\u3002');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = new TextDecoder('ascii').decode(bytes.slice(0, 12));
    if (!signature.startsWith('RIFF') || signature.slice(8) !== 'WEBP') throw new Error('\u8BF7\u9009\u62E9\u771F\u6B63\u7684 WebP \u56FE\u96C6\u3002');
    const chunks = new DataView(bytes.buffer);
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const tag = new TextDecoder('ascii').decode(bytes.slice(offset, offset + 4));
      if (tag === 'ANIM' || tag === 'ANMF') throw new Error('\u8BF7\u9009\u62E9\u5355\u5F20\u56FE\u96C6\uFF0C\u4E0D\u8981\u4F7F\u7528\u52A8\u753B WebP\u3002');
      const length = chunks.getUint32(offset + 4, true);
      offset += 8 + length + (length % 2);
    }
    const bitmap = await createImageBitmap(file);
    let version;
    try {
      if (bitmap.width !== 1536 || ![1872, 2288].includes(bitmap.height)) throw new Error('\u56FE\u96C6\u5C3A\u5BF8\u5E94\u4E3A 1536 \xD7 1872\uFF08V1\uFF09\u6216 1536 \xD7 2288\uFF08V2\uFF09\u3002');
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
      let transparent = false;
      let visible = false;
      for (let index = 3; index < pixels.length && !(transparent && visible); index += 4) {
        transparent ||= pixels[index] === 0;
        visible ||= pixels[index] > 0;
      }
      if (!transparent || !visible) throw new Error('\u56FE\u96C6\u9700\u8981\u540C\u65F6\u5305\u542B\u900F\u660E\u80CC\u666F\u548C\u53EF\u89C1\u89D2\u8272\u3002');
      version = bitmap.height === 2288 ? 2 : 1;
    } finally { bitmap.close(); }
    if (generation !== atlasGeneration) return;
    url = URL.createObjectURL(file);
    selectedAtlas = { bytes, url, version };
    const sprite = document.createElement('div');
    sprite.className = 'sprite large';
    sprite.setAttribute('role', 'img');
    sprite.setAttribute('aria-label', '\u4E0A\u4F20\u56FE\u96C6\u7684\u52A8\u4F5C\u9884\u89C8');
    sprite.style.backgroundImage = \`url("\${url}")\`;
    $('#creator-pet-stage').append(sprite);
    updateCreatorControls();
    updatePreview('creator', 'action', Number($('#creator-action').value));
    $('#atlas-status').textContent = \`V\${version} \u56FE\u96C6\u5DF2\u901A\u8FC7\u5C3A\u5BF8\u3001\u5355\u56FE\u3001\u900F\u660E\u4E0E\u53EF\u89C1\u5185\u5BB9\u68C0\u67E5\u3002\`;
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    if (generation === atlasGeneration) $('#atlas-status').textContent = error.message;
  }
}

for (const prefix of ['detail', 'creator']) {
  const select = $(\`#\${prefix}-action\`);
  select.innerHTML = '<option value="" disabled>\u9009\u62E9\u52A8\u4F5C</option>' + actions.map(([label], index) => \`<option value="\${index}">\${label}</option>\`).join('');
  select.value = '0';
  $(\`#\${prefix}-action-buttons\`).innerHTML = actions.map(([label], index) => \`<button type="button" data-preview-action="\${index}" aria-pressed="false">\${label}</button>\`).join('');
  $(\`#\${prefix}-look-buttons\`).innerHTML = Array.from({ length: 16 }, (_, index) => \`<button type="button" data-preview-look="\${index}" aria-pressed="false">\${index * 22.5}\xB0\${lookDirections[index] ? \` \xB7 \${lookDirections[index]}\` : ''}</button>\`).join('');
  select.addEventListener('change', () => updatePreview(prefix, 'action', Number(select.value)));
  $(\`#\${prefix}-action-buttons\`).addEventListener('click', event => {
    const button = event.target.closest('[data-preview-action]');
    if (button) updatePreview(prefix, 'action', Number(button.dataset.previewAction));
  });
  $(\`#\${prefix}-look-buttons\`).addEventListener('click', event => {
    const button = event.target.closest('[data-preview-look]');
    if (button) updatePreview(prefix, 'look', Number(button.dataset.previewLook));
  });
  $(\`#\${prefix}-background\`).addEventListener('change', event => {
    $(\`#\${prefix}-pet-stage\`).dataset.background = event.target.value;
  });
}
updateCreatorControls();
$('.category-bar').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (button) {
    category = button.dataset.category;
    resetGallery();
    Array.from($('.category-bar').querySelectorAll('button')).find(item => item.dataset.category === category)?.focus();
  }
});
$('#search').addEventListener('input', resetGallery);
$('#sort').addEventListener('change', () => {
  if ($('#sort').value === 'random') shuffledIds = shuffle(works.map(item => item.id));
  resetGallery();
});
$('#gallery-more').addEventListener('click', () => { visibleLimit += galleryPageSize; renderGallery(); });
$('#gallery-random').addEventListener('click', () => {
  const candidates = filteredWorks();
  if (candidates.length === 0) { toast('\u5F53\u524D\u6CA1\u6709\u5339\u914D\u4F5C\u54C1\uFF0C\u8BF7\u5148\u6E05\u9664\u7B5B\u9009\u3002'); return; }
  const work = candidates[Math.floor(Math.random() * candidates.length)];
  if (work.kind === 'pet') location.hash = \`pets/\${work.id}\`;
  else if (work.pluginType) location.hash = \`plugins/\${work.id}\`;
  else openPluginCreator(work);
});
$('#clear-search').addEventListener('click', () => { category = '\u5168\u90E8'; $('#search').value = ''; resetGallery(); $('#search').focus(); });

function openPluginCreator(work) {
  if (work.kind === 'plugin') openToolDetail({ ...work, pluginType: work.pluginType || 'declarative', features: work.features || [], permissionLabels: work.permissionLabels || [], hostNotice: work.hostNotice || '', version: work.version || '1.0.0', source: work.source || templateCredit.source, license: work.license || templateCredit.license });
}

$('#cards').addEventListener('click', async event => {
  const control = event.target.closest('[data-like], [data-preview], [data-share], [data-install-help]');
  if (!control) return;
  event.preventDefault();
  const id = control.dataset.like || control.dataset.preview || control.dataset.share || control.dataset.installHelp;
  const work = works.find(item => item.id === id);
  if (!work) return;
  if (control.dataset.like) {
    await recordActivity(id, 'like');
    if (['likes', 'trending'].includes($('#sort').value)) {
      renderGallery();
      Array.from($('#cards').querySelectorAll('[data-like]')).find(button => button.dataset.like === id)?.focus();
    }
  } else if (control.dataset.preview) {
    if (work.kind === 'pet') {
      if (location.hash === \`#pets/\${id}\`) openPetDetail(work);
      else location.hash = \`pets/\${id}\`;
    } else if (work.pluginType) {
      if (location.hash === \`#plugins/\${id}\`) openToolDetail(work);
      else location.hash = \`plugins/\${id}\`;
    } else openPluginCreator(work);
  } else if (control.dataset.share) {
    const url = new URL(location.href);
    url.hash = work.kind === 'pet' ? \`pets/\${id}\` : work.pluginType ? \`plugins/\${id}\` : 'plugins';
    await copyGalleryText(url.href, url.hostname === '127.0.0.1' ? '\u672C\u673A\u4F5C\u54C1\u94FE\u63A5\u5DF2\u590D\u5236\uFF1B\u5176\u4ED6\u7535\u8111\u8BF7\u5206\u4EAB ZIP\u3002' : '\u4F5C\u54C1\u94FE\u63A5\u5DF2\u590D\u5236\u3002');
    closeCardMenus();
  } else {
    const instruction = work.kind === 'pet'
      ? \`\u8BF7\u5E2E\u52A9\u6211\u5728 desktop pet \u4E2D\u5B89\u88C5\u300C\${work.title}\u300D\u3002\u5148\u4E0B\u8F7D\u4F5C\u54C1 ZIP\uFF1A\${new URL(work.download, location.href).href}\u3002\u5728\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u300C\u6211\u7684\u684C\u5BA0\u300D\u9009\u62E9\u300C\u5BFC\u5165 ZIP \u6216\u6587\u4EF6\u5939\u300D\uFF0C\u5BFC\u5165\u8FD9\u4E2A ZIP \u540E\u8BBE\u4E3A\u5F53\u524D\u684C\u5BA0\u3002\u4FDD\u7559\u5305\u5185 SHARE.md \u7684\u4F5C\u8005\u4E0E\u8BB8\u53EF\u58F0\u660E\u3002\u4E0D\u8981\u6539\u52A8\u6211\u7684 AI \u914D\u7F6E\u6216\u5BC6\u94A5\u3002\`
      : work.pluginType === 'community-plugin' ? \`\u8BF7\u5E2E\u52A9\u6211\u4F7F\u7528\u793E\u533A\u4F5C\u54C1\u300C\${work.title}\u300D\u3002\u4E0B\u8F7D\u5B8C\u6574 ZIP\uFF1A\${new URL(work.download, location.href).href}\u3002\u5148\u9605\u8BFB\u539F\u9879\u76EE\u6E05\u5355\u3001\u5305\u5185 SHARE.md \u548C\u4F5C\u54C1\u8BF4\u660E\uFF1A\${work.hostNotice}\u3002\u517C\u5BB9 desktop pet \u65F6\u4ECE\u672C\u5730\u63D2\u4EF6\u7BA1\u7406\u5BFC\u5165\u5E76\u786E\u8BA4\u6743\u9650\u3001\u4F9D\u8D56\uFF1B\u9700\u8981\u5176\u4ED6\u5BBF\u4E3B\u5219\u6309\u539F\u9879\u76EE\u8BF4\u660E\u4F7F\u7528\uFF0C\u4E0D\u81EA\u52A8\u6539\u5199\u539F\u903B\u8F91\u6216\u6267\u884C\u672A\u77E5\u547D\u4EE4\u3002\u4FDD\u7559\u4F5C\u8005\u548C\u8BB8\u53EF\u3002\`
      : \`\u8BF7\u5E2E\u52A9\u6211\u5B89\u88C5\${work.pluginType ? '\u672C\u673A' : '\u63D0\u9192'}\u63D2\u4EF6\u300C\${work.title}\u300D\u3002\u4E0B\u8F7D ZIP\uFF1A\${new URL(work.download, location.href).href}\u3002\u5148\u89E3\u538B\uFF0C\u5728\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u300C\u63D2\u4EF6\u7BA1\u7406\u300D\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\uFF0C\u786E\u8BA4\u6743\u9650\u540E\u542F\u7528\u3002\u4FDD\u7559\u539F\u5305\u4E2D\u7684\u7248\u6743\u4E0E\u8BB8\u53EF\u58F0\u660E\u3002\${work.requirements ?? ''}\${work.pluginType === 'host-tool' ? '\u672C\u673A\u5DE5\u5177\u7531\u5339\u914D\u7248\u672C\u7684 desktop pet \u5BBF\u4E3B\u63D0\u4F9B\uFF0C\u542F\u7528\u540E\u4ECE\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\u3002\u4E0D\u8981\u4EE3\u6211\u81EA\u52A8\u5220\u9664\u6587\u4EF6\u3001\u5378\u8F7D\u7A0B\u5E8F\u6216\u5F00\u542F\u76D1\u6D4B\u3002' : ''}\`;
    await copyGalleryText(instruction, '\u5B89\u88C5\u8BF4\u660E\u5DF2\u590D\u5236\uFF0C\u53EF\u4EE5\u4EA4\u7ED9\u4F60\u9009\u62E9\u7684 AI\u3002');
    closeCardMenus();
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('[data-download]');
  if (link && works.some(work => work.id === link.dataset.download)) recordActivity(link.dataset.download, 'download');
  if (link && publicationSession?.interactionsAvailable) setTimeout(() => { void refreshSharedActivity(); }, 1500);
  if (!event.target.closest('.install-menu, .share-menu')) closeCardMenus();
});
$('#cards').addEventListener('toggle', event => {
  if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
  $('#cards').querySelectorAll('details[open]').forEach(menu => { if (menu !== event.target) menu.open = false; });
}, true);
document.addEventListener('keydown', event => {
  const typing = event.target.closest('input, textarea, select, [contenteditable="true"]');
  if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && ['pets', 'plugins'].includes(route) && !$('#pet-detail').open && !$('#tool-detail')?.open) {
    event.preventDefault();
    $('#search').focus();
  }
  if (event.key === 'Escape') closeCardMenus();
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').setAttribute('aria-label', theme === 'dark' ? '\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F' : '\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F');
  $('#theme-toggle').setAttribute('aria-pressed', String(theme === 'dark'));
  $('#theme-toggle').textContent = theme === 'dark' ? '\u2600' : '\u263E';
}
try {
  setTheme(localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light');
} catch {
  setTheme('light');
}
$('#theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem(themeKey, theme); } catch { toast('\u4E3B\u9898\u5DF2\u5207\u6362\uFF1B\u6B64\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u4FDD\u5B58\u504F\u597D\u3002'); }
});
$('#close-detail').addEventListener('click', () => $('#pet-detail').close());
$('#pet-detail').addEventListener('close', () => {
  $('#detail-sprite').getAnimations().forEach(animation => animation.cancel());
  if (location.hash.startsWith('#pets/')) history.replaceState(null, '', '#pets');
});
$('#atlas-input').addEventListener('change', () => { void selectAtlas(); });
let petMode = 'make';
let creatorWorkflow = null;
const sessionDrafts = new Map();
let clips = [];
let clipGeneration = 0;
let pluginCover = null;
let importPreviewUrl;
const importedPackages = { pet: null, plugin: null };
const uploadGenerations = { pet: 0, plugin: 0 };
const stateNames = { idle: '\u5F85\u673A', 'running-right': '\u5411\u53F3\u884C\u8D70', 'running-left': '\u5411\u5DE6\u884C\u8D70', waving: '\u6325\u624B', jumping: '\u5E86\u795D', failed: '\u5931\u8D25', waiting: '\u7B49\u5F85', running: '\u5DE5\u4F5C', review: '\u601D\u8003', sleeping: '\u7761\u89C9', clicked: '\u70B9\u51FB', dragged: '\u62D6\u62FD' };
const stateLabels = petStateIds.map(id => [id, stateNames[id]]);

function creatorFeedback(message, error = false) {
  $('#creator-feedback').dataset.error = String(error);
  $('#creator-feedback').textContent = message;
}

function setPetMode(mode) {
  petMode = mode;
  $('#pet-make-fields').hidden = mode !== 'make';
  $('#pet-import-fields').hidden = mode !== 'import';
  $('#pet-form .preview-panel').hidden = mode === 'import';
  const idField = $('#pet-form').elements.namedItem('id');
  if (mode === 'make') idField.setAttribute('pattern', '[a-z0-9][a-z0-9_-]{0,63}'); else idField.removeAttribute('pattern');
  if (mode === 'import') $('#creator-pet-stage video')?.pause();
  if (mode === 'import') $('#pet-form .form-panel').prepend($('#pet-import-fields'));
  updateMaterialInputs();
}

function updateMaterialInputs() {
  const video = $('#pet-media-mode').value === 'video';
  $('#pet-media-mode').disabled = petMode === 'import';
  for (const [selector, inactive] of [['#pet-video-fields', petMode === 'import' || !video], ['#pet-atlas-fields', petMode === 'import' || video]]) $(selector).querySelectorAll('input, select, button').forEach(element => { element.disabled = inactive; });
}

function clipMetadata() {
  return clips.map((clip, index) => {
    const row = $(\`[data-clip-index="\${index}"]\`);
    return { ...clip, id: row.querySelector('[data-clip-field="id"]').value.trim(), displayName: row.querySelector('[data-clip-field="displayName"]').value.trim(), category: row.querySelector('[data-clip-field="category"]').value.trim() };
  });
}

function renderBindings(saved = {}) {
  const existing = Object.fromEntries(Array.from($('#state-bindings').querySelectorAll('select')).map(select => [select.dataset.state, select.value]));
  const entries = clipMetadata();
  $('#state-bindings').innerHTML = stateLabels.map(([id, label]) => \`<div class="binding-field"><label>\${label}<select data-state="\${id}"><option value="">\${id === 'idle' ? '\u7B2C\u4E00\u4E2A\u52A8\u4F5C' : '\u4F7F\u7528\u5F85\u673A'}</option>\${entries.map(clip => \`<option value="\${escapeHtml(clip.id)}">\${escapeHtml(clip.displayName || clip.id)}</option>\`).join('')}</select></label><button class="secondary" type="button" data-preview-binding="\${id}" \${entries.length ? '' : 'disabled'}>\u9884\u89C8\u6B64\u7ED1\u5B9A</button></div>\`).join('');
  $('#state-bindings').querySelectorAll('select').forEach(select => {
    const requested = saved[select.dataset.state] ?? existing[select.dataset.state] ?? (entries.some(clip => clip.id === select.dataset.state) ? select.dataset.state : '');
    select.value = entries.some(clip => clip.id === requested) ? requested : '';
  });
}

function renderClips() {
  $('#clip-list').innerHTML = clips.map((clip, index) => \`<div class="creator-clip" data-clip-index="\${index}" data-action-id="\${escapeHtml(clip.id)}"><p class="hint">\${escapeHtml(clip.file)} \xB7 \${(clip.bytes.length / 1024 / 1024).toFixed(1)} MB</p><div class="field-grid"><label>\u52A8\u4F5C\u540D\u79F0<input data-clip-field="displayName" maxlength="80" required value="\${escapeHtml(clip.displayName)}"></label><label>\u52A8\u4F5C\u79CD\u7C7B<input data-clip-field="category" maxlength="80" required value="\${escapeHtml(clip.category)}" placeholder="\u4F8B\u5982\uFF1A\u966A\u4F34 / \u4E92\u52A8 / \u5DE5\u4F5C"></label></div><label>\u52A8\u4F5C ID<input data-clip-field="id" maxlength="64" required pattern="[a-z0-9][a-z0-9_-]{0,63}" value="\${escapeHtml(clip.id)}"></label><div class="creator-submit-actions"><button class="secondary" type="button" data-preview-clip="\${index}">\u9884\u89C8\u52A8\u4F5C</button><button class="secondary" type="button" data-remove-clip="\${index}">\u79FB\u9664</button></div></div>\`).join('');
  renderBindings();
}

function previewClip(index) {
  const clip = clips[index];
  if (!clip) return;
  const element = document.createElement(clip.file.endsWith('.webp') ? 'img' : 'video');
  if (element instanceof HTMLVideoElement) { element.controls = true; element.muted = true; element.loop = true; element.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches; element.playsInline = true; }
  element.src = clip.url;
  element.className = 'creator-media-preview';
  element.setAttribute('aria-label', clipMetadata()[index].displayName);
  $('#creator-pet-stage video')?.pause();
  $('#creator-pet-stage .sprite')?.getAnimations().forEach(animation => animation.cancel());
  $('#creator-pet-stage').replaceChildren(element);
  $('#creator-current-preview').textContent = \`\u6B63\u5728\u9884\u89C8\uFF1A\${clipMetadata()[index].displayName} \xB7 \u539F\u7D20\u6750\u80CC\u666F\`;
}

$('#pet-media-mode').addEventListener('change', event => {
  const video = event.target.value === 'video';
  $('#pet-video-fields').hidden = !video;
  $('#pet-atlas-fields').hidden = video;
  for (const selector of ['#creator-action', '#creator-action-buttons', '#creator-look-section', '#atlas-status']) $(selector).hidden = video;
  $('#creator-action').parentElement.hidden = video;
  updateMaterialInputs();
  $('#creator-pet-stage video')?.pause();
  $('#creator-pet-stage .sprite')?.getAnimations().forEach(animation => animation.cancel());
  $('#creator-pet-stage').replaceChildren();
  $('#creator-current-preview').textContent = video ? '\u6DFB\u52A0\u52A8\u4F5C\u6587\u4EF6\u540E\u5373\u53EF\u9884\u89C8' : '\u9009\u62E9\u56FE\u96C6\u540E\u5373\u53EF\u9884\u89C8';
  if (video && !clips.length) { const hint = document.createElement('p'); hint.textContent = '\u6DFB\u52A0\u52A8\u4F5C\u6587\u4EF6\u540E\uFF0C\u5728\u8FD9\u91CC\u9884\u89C8'; $('#creator-pet-stage').append(hint); }
  if (video && clips.length) previewClip(0);
  else if (!video && selectedAtlas) { const sprite = document.createElement('div'); sprite.className = 'sprite large'; sprite.style.backgroundImage = \`url("\${selectedAtlas.url}")\`; $('#creator-pet-stage').append(sprite); updateCreatorControls(); updatePreview('creator', 'action', 0); }
});
$('#clip-background').addEventListener('change', event => { $('#clip-color-label').hidden = event.target.value === 'alpha'; });
$('#state-bindings').addEventListener('click', event => {
  const button = event.target.closest('[data-preview-binding]');
  if (!button) return;
  const state = button.dataset.previewBinding;
  const metadata = clipMetadata();
  const fallback = metadata.some(clip => clip.id === 'idle') ? 'idle' : $('[data-state="idle"]').value || metadata[0]?.id;
  const requested = $(\`[data-state="\${state}"]\`).value || fallback;
  const index = metadata.findIndex(clip => clip.id === requested);
  if (index < 0) return creatorFeedback('\u8BF7\u5148\u6DFB\u52A0\u5E76\u9009\u62E9\u8981\u9884\u89C8\u7684\u52A8\u4F5C\u3002', true);
  previewClip(index);
  $('#creator-current-preview').textContent = \`\u7ED1\u5B9A\u9884\u89C8\uFF1A\${stateLabels.find(([id]) => id === state)[1]} \u2192 \${metadata[index].displayName}\`;
});
$('#clip-input').addEventListener('change', async event => {
  const generation = ++clipGeneration;
  const next = clipMetadata();
  const createdUrls = [];
  try {
    for (const file of event.target.files) {
      if (next.length >= 100) throw new Error('\u6700\u591A\u6DFB\u52A0 100 \u4E2A\u52A8\u4F5C\u3002');
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['mp4', 'webm', 'webp'].includes(extension)) throw new Error('\u8BF7\u9009\u62E9 MP4\u3001WebM \u6216\u52A8\u753B WebP\u3002');
      if (file.size > 100 * 1024 * 1024 || next.reduce((sum, clip) => sum + clip.bytes.length, file.size) > 200 * 1024 * 1024) throw new Error('\u5355\u6587\u4EF6\u6700\u5927 100 MB\uFF0C\u52A8\u4F5C\u603B\u91CF\u6700\u5927 200 MB\u3002');
      const sequence = crypto.randomUUID().slice(0, 8);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (generation !== clipGeneration) { createdUrls.forEach(url => URL.revokeObjectURL(url)); return; }
      const url = URL.createObjectURL(file); createdUrls.push(url);
      next.push({ id: next.length ? \`action-\${sequence}\` : 'idle', displayName: file.name.replace(/\\.[^.]+$/, ''), category: '\u966A\u4F34', file: \`actions/\${sequence}.\${extension}\`, bytes, url });
    }
    clips = next;
    renderClips();
    if (clips.length) previewClip(clips.length - 1);
    creatorFeedback(\`\u5DF2\u6DFB\u52A0 \${clips.length} \u4E2A\u52A8\u4F5C\uFF0C\u53EF\u7F16\u8F91\u540D\u79F0\u4E0E\u79CD\u7C7B\u3002\`);
  } catch (error) { createdUrls.forEach(url => URL.revokeObjectURL(url)); if (generation === clipGeneration) creatorFeedback(error.message, true); }
  event.target.value = '';
});
function updateClipBindings(event) {
  const field = event.target.closest('[data-clip-field]');
  if (!field || !['id', 'displayName'].includes(field.dataset.clipField)) return;
  const metadata = clipMetadata();
  if (metadata.some(clip => !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(clip.id)) || new Set(metadata.map(clip => clip.id)).size !== metadata.length) return;
  const bindings = Object.fromEntries(Array.from($('#state-bindings').querySelectorAll('select')).map(select => [select.dataset.state, select.value]));
  if (field.dataset.clipField === 'id') {
    const row = field.closest('[data-clip-index]');
    for (const state of Object.keys(bindings)) if (bindings[state] === row.dataset.actionId) bindings[state] = field.value.trim();
    row.dataset.actionId = field.value.trim();
  }
  renderBindings(bindings);
}
$('#clip-list').addEventListener('input', updateClipBindings);
$('#clip-list').addEventListener('change', updateClipBindings);
$('#clip-list').addEventListener('click', event => {
  const preview = event.target.closest('[data-preview-clip]');
  if (preview) previewClip(Number(preview.dataset.previewClip));
  const remove = event.target.closest('[data-remove-clip]');
  if (remove) { clips = clipMetadata(); const [clip] = clips.splice(Number(remove.dataset.removeClip), 1); URL.revokeObjectURL(clip.url); renderClips(); if (clips.length) previewClip(0); else $('#creator-pet-stage').replaceChildren(); }
});

async function inflateZip(bytes, maximum) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maximum) throw new Error('ZIP \u5B9E\u9645\u89E3\u538B\u5185\u5BB9\u8D85\u8FC7\u6E05\u5355\u5927\u5C0F\u3002');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function displayImportedPackage(kind, replaceWork = false) {
  const entry = importedPackages[kind];
  const info = inspectImportPackage(entry.files, kind);
  const { report } = info;
  entry.report = report;
  const labels = { native: '\u539F\u751F\u517C\u5BB9', partial: '\u90E8\u5206\u652F\u6301', external: '\u9700\u539F\u5BBF\u4E3B', invalid: '\u65E0\u6CD5\u8BC6\u522B\u6216\u76F4\u63A5\u517C\u5BB9' };
  const reportElement = $(\`#\${kind}-compatibility\`);
  reportElement.hidden = false;
  reportElement.dataset.level = report.level;
  reportElement.innerHTML = \`<p class="eyebrow">\u9759\u6001\u517C\u5BB9\u6027\u68C0\u67E5</p><h3>\${labels[report.level]} \xB7 \${escapeHtml(report.format)}</h3>\${report.reasons.length ? \`<ul>\${report.reasons.map(value => \`<li>\${escapeHtml(value)}</li>\`).join('')}</ul>\` : ''}\${report.unsupported.length ? \`<p class="hint">\u4E0D\u652F\u6301\uFF1A\${escapeHtml(report.unsupported.join('\u3001'))}</p>\` : ''}\`;
  $(\`#\${kind}-package-status\`).textContent = \`\${info.fileCount} \u4E2A\u6587\u4EF6 \xB7 \${(info.bytes / 1024 / 1024).toFixed(1)} MB\`;
  $(\`#\${kind}-package-list\`).innerHTML = Object.keys(entry.files).slice(0, 50).map(name => \`<li>\${escapeHtml(name)}</li>\`).join('') + (info.fileCount > 50 ? \`<li>\u53E6\u6709 \${info.fileCount - 50} \u4E2A\u6587\u4EF6\uFF0C\u5BFC\u51FA\u65F6\u5168\u90E8\u4FDD\u7559</li>\` : '');
  if (kind === 'plugin') {
    $('#permission-preview').textContent = Array.isArray(info.manifest.permissions) ? info.manifest.permissions.join(' \xB7 ') || '\u6E05\u5355\u672A\u8BF7\u6C42\u6743\u9650' : '\u672A\u63D0\u4F9B\u672C\u7CFB\u7EDF\u6743\u9650\u58F0\u660E';
    $('#plugin-import-capability-note').textContent = report.capabilities.originalLogic ? '' : '\u8BF7\u4F7F\u7528\u539F\u5BBF\u4E3B\u3002';
    if (creatorWorkflow !== 'plugin-make' || pluginCover?.origin !== 'selected') setPluginCover(info.cover ? { ...info.cover, origin: 'package' } : null);
  } else {
    $('[data-import-preview]').disabled = !report.capabilities.preview;
    $('[data-import-preview]').title = report.capabilities.preview ? '\u53EA\u9884\u89C8\u539F\u5305\u7D20\u6750\uFF0C\u4E0D\u6267\u884C\u539F\u903B\u8F91' : '\u672C\u7CFB\u7EDF\u4E0D\u80FD\u9884\u89C8\u6B64\u683C\u5F0F\uFF0C\u8BF7\u6309\u539F\u9879\u76EE\u8BF4\u660E\u5728\u539F\u5BBF\u4E3B\u4F7F\u7528';
    $('#pet-import-capability-note').textContent = report.capabilities.actions ? '' : '\u8BF7\u4F7F\u7528\u539F\u5BBF\u4E3B\u3002';
    clearImportPreview();
  }
  const form = $(\`#\${kind}-form\`);
  const current = Object.fromEntries(['id', 'title', 'description', 'author', 'source', 'license'].map(key => [key, form.elements.namedItem(kind === 'pet' && key === 'title' ? 'displayName' : key).value]));
  for (const [key, value] of Object.entries(packageWorkFields(current, info.workInfo, replaceWork))) {
    form.elements.namedItem(kind === 'pet' && key === 'title' ? 'displayName' : key).value = value;
  }
  if (kind === 'plugin') renderPluginCardPreview();
}

function clearImportPreview() {
  $('#pet-import-preview video')?.pause();
  $('#pet-import-preview .sprite')?.getAnimations().forEach(animation => animation.cancel());
  $('#pet-import-preview').replaceChildren();
  $('#pet-import-preview').hidden = true;
  if (importPreviewUrl) URL.revokeObjectURL(importPreviewUrl);
  importPreviewUrl = undefined;
}

$('[data-import-preview]').addEventListener('click', () => {
  const entry = importedPackages.pet;
  if (!entry) return;
  const info = inspectImportPackage(entry.files, 'pet');
  if (!info.report.capabilities.preview) return;
  clearImportPreview();
  const manifest = info.manifest;
  const media = manifest.mediaVersion === 1;
  const path = info.assetPrefix + (media ? manifest.actions[manifest.stateBindings?.idle || 'idle'] || manifest.actions.idle : manifest.spritesheetPath || 'spritesheet.webp');
  const bytes = entry.files[path];
  if (!bytes) return creatorFeedback('\u539F\u5305\u7F3A\u5C11\u9884\u89C8\u6587\u4EF6\u3002', true);
  importPreviewUrl = URL.createObjectURL(new Blob([bytes]));
  let element;
  if (!media) {
    element = document.createElement('div'); element.className = 'sprite large'; element.style.backgroundImage = \`url("\${importPreviewUrl}")\`;
    animateSprite(element, actions[0], manifest.spriteVersionNumber || 1);
  } else {
    element = document.createElement(path.toLowerCase().endsWith('.webp') ? 'img' : 'video');
    element.className = 'creator-media-preview'; element.src = importPreviewUrl;
    if (element instanceof HTMLVideoElement) { element.controls = true; element.muted = true; element.loop = true; element.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches; }
  }
  element.setAttribute('aria-label', '\u539F\u5305\u5F85\u673A\u7D20\u6750\u9884\u89C8');
  $('#pet-import-preview').append(element);
  $('#pet-import-preview').hidden = false;
  creatorFeedback('\u6B63\u5728\u9884\u89C8\u5F85\u673A\u52A8\u4F5C\u3002');
});

function setPluginCover(cover) {
  if (pluginCover?.url) URL.revokeObjectURL(pluginCover.url);
  pluginCover = cover ? { ...cover, url: URL.createObjectURL(new Blob([cover.bytes], { type: cover.mime || coverImageType(cover.bytes).mime })) } : null;
  $('#plugin-cover-remove').hidden = !pluginCover;
  renderPluginCardPreview();
}

function renderPluginCardPreview() {
  const form = $('#plugin-form');
  const value = name => form.elements.namedItem(name).value.trim();
  const report = importedPackages.plugin?.report;
  $('#plugin-card-preview').innerHTML = renderCard({ id: 'creator-preview', kind: 'plugin', pluginType: 'javascript', title: value('title') || '\u4F60\u7684\u63D2\u4EF6\u540D\u79F0', description: value('description') || '\u586B\u5199\u8BF4\u660E\u540E\u5728\u8FD9\u91CC\u9884\u89C8', author: value('author') || '\u4F60\u7684\u7F72\u540D', category: '\u63D2\u4EF6', permissionLabels: [], symbol: '\u2726', cover: pluginCover?.url, hostFormat: report && report.level !== 'native' ? report.format : undefined }, true);
  const image = $('#plugin-card-preview .plugin-cover');
  const activeCoverUrl = pluginCover?.url;
  if (image) image.addEventListener('error', () => {
    if (pluginCover?.url !== activeCoverUrl) return;
    image.hidden = true;
    creatorFeedback('\u5C01\u9762\u56FE\u7247\u65E0\u6CD5\u89E3\u7801\u663E\u793A\uFF0C\u539F\u6587\u4EF6\u4ECD\u4FDD\u7559\u3002\u8BF7\u91CD\u65B0\u9009\u62E9\u53EF\u6253\u5F00\u7684 PNG\u3001JPEG \u6216 WebP \u56FE\u7247\u3002', true);
  }, { once: true });
}

let coverGeneration = 0;
$('#plugin-cover-input').addEventListener('change', async event => {
  const generation = ++coverGeneration;
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) throw new Error('\u63D2\u4EF6\u5C01\u9762\u6700\u5927 10 MB\u3002');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = coverImageType(bytes);
    const bitmap = await createImageBitmap(new Blob([bytes], { type: type.mime }));
    bitmap.close();
    if (generation !== coverGeneration) return;
    setPluginCover({ bytes, path: \`community-cover/\${crypto.randomUUID()}.\${type.extension}\`, ...type, origin: 'selected' });
    creatorFeedback('\u5C01\u9762\u5DF2\u52A0\u5165\u4F5C\u54C1\uFF0C\u53F3\u4FA7\u663E\u793A\u5B9E\u9645\u5361\u7247\u5E03\u5C40\u3002\u4FDD\u5B58\u8349\u7A3F\u6216\u4E0B\u8F7D\u5206\u4EAB\u5305\u4F1A\u4FDD\u7559\u56FE\u7247\u3002');
  } catch (error) { if (generation === coverGeneration) creatorFeedback(\`\u5C01\u9762\u672A\u66F4\u65B0\uFF1A\${error.message}\`, true); }
  event.target.value = '';
});
$('#plugin-cover-remove').addEventListener('click', () => { ++coverGeneration; setPluginCover(null); });
$('#plugin-form').addEventListener('input', renderPluginCardPreview);

for (const kind of ['pet', 'plugin']) for (const mode of ['zip', 'folder', 'files']) {
  $(\`#\${kind}-package-\${mode}\`).addEventListener('change', async event => {
    const generation = ++uploadGenerations[kind];
    try {
      if (!event.target.files.length) return;
      if (creatorWorkflow?.endsWith('-import')) {
        const form = $(\`#\${kind}-form\`);
        for (const name of ['id', kind === 'pet' ? 'displayName' : 'title', 'description', 'author', 'source', 'license']) form.elements.namedItem(name).value = '';
      }
      $(\`#\${kind}-package-status\`).textContent = '\u6B63\u5728\u8BFB\u53D6\u4F5C\u54C1\u6587\u4EF6\u2026';
      let files;
      if (mode === 'zip') files = await readZipPackage(new Uint8Array(await event.target.files[0].arrayBuffer()), inflateZip);
      else {
        files = Object.create(null);
        let total = 0;
        if (event.target.files.length > 1000) throw new Error('\u6700\u591A\u5BFC\u5165 1000 \u4E2A\u6587\u4EF6\u3002');
        for (const file of event.target.files) {
          const name = file.webkitRelativePath || file.name;
          safePackagePath(name);
          total += file.size;
          if (file.size > 100 * 1024 * 1024 || total > 200 * 1024 * 1024) throw new Error('\u5355\u6587\u4EF6\u6700\u5927 100 MB\uFF0C\u603B\u91CF\u6700\u5927 200 MB\u3002');
          if (Object.hasOwn(files, name)) throw new Error('\u5B58\u5728\u540C\u540D\u6587\u4EF6\uFF0C\u8BF7\u4F7F\u7528\u6587\u4EF6\u5939\u6216 ZIP \u4FDD\u7559\u5B50\u76EE\u5F55\u3002');
          files[name] = new Uint8Array(await file.arrayBuffer());
        }
      }
      files = normalizePackageFiles(files);
      inspectImportPackage(files, kind);
      if (generation !== uploadGenerations[kind]) return;
      importedPackages[kind] = { files };
      displayImportedPackage(kind, creatorWorkflow?.endsWith('-import'));
      creatorFeedback('\u4F5C\u54C1\u6587\u4EF6\u5DF2\u8BFB\u53D6\u3002\u586B\u5199\u4F5C\u54C1\u4FE1\u606F\u540E\u53EF\u4FDD\u5B58\u8349\u7A3F\u6216\u4E0B\u8F7D\u5B8C\u6574\u5206\u4EAB\u5305\u3002');
    } catch (error) {
      if (generation === uploadGenerations[kind]) { importedPackages[kind] = null; $(\`#\${kind}-package-status\`).textContent = error.message; $(\`#\${kind}-package-list\`).replaceChildren(); $(\`#\${kind}-compatibility\`).hidden = true; if (kind === 'plugin') $('#permission-preview').textContent = '\u6E05\u5355\u672A\u6210\u529F\u8BFB\u53D6'; else { $('[data-import-preview]').disabled = true; clearImportPreview(); } creatorFeedback(error.message, true); }
    }
  });
}

async function checkCreationImages(files, kind) {
  for (const check of creationImageChecks(files, kind)) {
    const bytes = files[check.path];
    if (new TextDecoder('ascii').decode(bytes.subarray(0, 4)) !== 'RIFF' || new TextDecoder('ascii').decode(bytes.subarray(8, 12)) !== 'WEBP') throw new Error(\`\u8BF7\u4F7F\u7528\u771F\u5B9E WebP\uFF1A\${check.path}\u3002\`);
    if (kind === 'pet' && !check.frames) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let at = 12; at + 8 <= bytes.length;) {
        const tag = new TextDecoder('ascii').decode(bytes.subarray(at, at + 4));
        const length = view.getUint32(at + 4, true);
        if (['ANIM', 'ANMF'].includes(tag) || at + 8 + length > bytes.length) throw new Error('\u56FE\u96C6\u5FC5\u987B\u662F\u5B8C\u6574\u5355\u5F20 WebP\u3002');
        at += 8 + length + (length % 2);
      }
    }
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/webp' }));
    try {
      if (bitmap.width !== check.width || bitmap.height !== check.height) throw new Error(\`\u56FE\u7247\u5C3A\u5BF8\u4E0E\u6E05\u5355\u4E0D\u7B26\uFF1A\${check.path}\u3002\`);
      if (kind === 'pet' && !check.frames) {
        const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(bitmap, 0, 0);
        const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
        let transparent = false, visible = false;
        for (let at = 3; at < pixels.length && !(transparent && visible); at += 4) { transparent ||= pixels[at] === 0; visible ||= pixels[at] > 0; }
        if (!transparent || !visible) throw new Error('\u56FE\u96C6\u9700\u8981\u900F\u660E\u80CC\u666F\u548C\u53EF\u89C1\u89D2\u8272\u3002');
      }
    } finally { bitmap.close(); }
    if (check.frames) {
      if (!globalThis.ImageDecoder || !await ImageDecoder.isTypeSupported('image/webp')) throw new Error('\u6B64\u6D4F\u89C8\u5668\u65E0\u6CD5\u5B8C\u6574\u68C0\u67E5\u52A8\u753B WebP\u3002');
      const decoder = new ImageDecoder({ data: bytes, type: 'image/webp', preferAnimation: true });
      try {
        await decoder.tracks.ready;
        if (decoder.tracks.selectedTrack?.frameCount !== check.frames) throw new Error(\`\u52A8\u753B\u5E27\u6570\u65E0\u6548\uFF1A\${check.path}\u3002\`);
        for (let frameIndex = 0; frameIndex < check.frames; frameIndex++) {
          const frame = await decoder.decode({ frameIndex });
          try { if (frame.image.displayWidth !== check.width || frame.image.displayHeight !== check.height) throw new Error(\`\u52A8\u753B\u5E27\u5C3A\u5BF8\u65E0\u6548\uFF1A\${check.path}\u3002\`); }
          finally { frame.image.close(); }
        }
      } finally { decoder.close(); }
    }
  }
}

async function petShare(draft, workflow) {
    const kind = 'pet', input = draft.fields;
    let files;
    if (workflow === 'pet-import') {
      if (!draft.imported) throw new Error('\u8BF7\u5148\u4E0A\u4F20\u5B8C\u6574\u4F5C\u54C1\u6587\u4EF6\u3002');
      files = draft.imported.files;
    } else if (draft.mediaMode === 'atlas') {
      if (!draft.atlas) throw new Error('\u8BF7\u5148\u9009\u62E9\u901A\u8FC7\u68C0\u67E5\u7684\u56FE\u96C6\u3002');
      files = { 'pet.json': JSON.stringify(petManifest(input, draft.atlas.version), null, 2), 'spritesheet.webp': draft.atlas.bytes };
    } else {
      const metadata = draft.clips;
      const background = draft.background === 'alpha' ? { mode: 'alpha' } : { mode: 'chroma', color: draft.color, tolerance: 70 };
      const manifest = videoPetManifest(input, metadata, draft.bindings, background);
      files = Object.fromEntries(metadata.map(clip => [clip.file, clip.bytes]));
      files['pet.json'] = JSON.stringify(manifest, null, 2);
    }
    const safeId = String(input.id).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 64) || kind;
    const packaged = prepareWorkPackage(files, input, kind, workflow);
    if (workflow === 'pet-make') await checkCreationImages(packaged, kind);
    return { archive: zipPackage(packaged), name: \`\${safeId}-share.zip\`, files: packaged, metadata: { title: input.displayName, id: input.id, description: input.description, ...attribution(input), workflow } };
}

$('#pet-download-backup').addEventListener('click', async () => {
  try { const shared = await petShare(captureDraft('pet'), creatorWorkflow); download(shared.archive, shared.name); creatorFeedback('\u5206\u4EAB ZIP \u5DF2\u751F\u6210\u3002'); }
  catch (error) { creatorFeedback(error.message, true); }
});

function updatePublicationUI() {
  const available = publicationSession?.available === true;
  let repository, configurationError;
  try { repository = configuredSubmissionRepository(submissionRepository, publicationSession); } catch (error) { configurationError = error.message; }
  const canSubmit = Boolean(repository) || available && publicationSession.signedIn;
  $('#plugin-publication-status').textContent = publicationBusy ? '\u6B63\u5728\u751F\u6210\u6295\u7A3F\u5305\uFF0C\u8BF7\u52FF\u91CD\u590D\u63D0\u4EA4\u3002' : configurationError || (repository ? '\u751F\u6210 ZIP \u540E\u6253\u5F00\u672C\u7AD9 GitHub \u6295\u7A3F\u8868\u5355\uFF0C\u9644\u4E0A\u6587\u4EF6\u5E76\u63D0\u4EA4\uFF0C\u7B49\u5F85\u5BA1\u6838\u6536\u5F55\u3002' : !publicationSession ? '\u6B63\u5728\u68C0\u67E5\u6295\u7A3F\u670D\u52A1\u2026' : available && publicationSession.signedIn ? '\u53EF\u63D0\u4EA4\u4F5C\u54C1\uFF1B\u53D1\u5E03\u7ED3\u679C\u4EE5\u670D\u52A1\u786E\u8BA4\u4E3A\u51C6\u3002' : publicationSession.error || (publicSiteUrl ? '\u53EF\u4FDD\u5B58\u8349\u7A3F\u6216\u4E0B\u8F7D\u5206\u4EAB\u5305\uFF0C\u5230\u516C\u5F00\u5171\u521B\u5E73\u53F0\u67E5\u770B\u6295\u7A3F\u5165\u53E3\u3002' : '\u6295\u7A3F\u5165\u53E3\u5C1A\u672A\u5F00\u653E\uFF1B\u53EF\u4FDD\u5B58\u8349\u7A3F\u6216\u4E0B\u8F7D\u5206\u4EAB\u5305\u3002'));
  $('#plugin-publish').disabled = publicationBusy || !canSubmit;
  $('#plugin-publish').textContent = publicationBusy ? '\u6B63\u5728\u6253\u5305\u2026' : '\u6253\u5305\u5E76\u53D1\u5E03';
  $('#pet-publish').disabled = publicationBusy || !canSubmit;
  $('#pet-publish').textContent = publicationBusy ? '\u6B63\u5728\u6253\u5305\u2026' : '\u6253\u5305\u5E76\u53D1\u5E03';
  let publicUrl;
  try { const value = new URL(publicSiteUrl); if (value.protocol === 'https:') { value.hash = 'create'; publicUrl = value.href; } } catch { /* \u90E8\u7F72\u524D\u6CA1\u6709\u516C\u5F00\u5730\u5740\uFF0C\u4E0D\u5C55\u793A\u5360\u4F4D\u94FE\u63A5\u3002 */ }
  $('#plugin-public-site').hidden = canSubmit || !publicUrl;
  if (publicUrl) $('#plugin-public-site').href = publicUrl;
  $('#plugin-publication-help').textContent = repository ? 'GitHub Issue \u7684 ZIP \u9644\u4EF6\u4E0A\u9650\u4E3A 25 MB\uFF1B\u8F83\u5927\u7684\u5305\u8BF7\u6309\u4ED3\u5E93\u6295\u7A3F\u6307\u5357\u63D0\u4EA4 PR\u3002' : available ? '\u516C\u5F00 ZIP \u6700\u5927 32 MB\uFF1B\u4FDD\u5B58\u8349\u7A3F\u4E0E\u4E0B\u8F7D ZIP \u4E0D\u4F1A\u53D1\u5E03\u3002' : '';
  $('#creator-publishing-note').textContent = repository ? '\u63D0\u4EA4\u6295\u7A3F\u540E\u5F85\u5BA1\u6838\u6536\u5F55\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u5728\u5E7F\u573A\u4E0A\u7EBF\u3002' : available ? '\u53D1\u5E03\u7ED3\u679C\u4EE5\u670D\u52A1\u5668\u786E\u8BA4\u4E3A\u51C6\u3002' : '';
  $('#request-publish').disabled = !canSubmit;
  $('#request-public-site').hidden = canSubmit || !publicUrl;
  if (publicUrl) $('#request-public-site').href = publicUrl.replace(/#.*$/, '#requests');
  document.querySelectorAll('[data-activity-scope]').forEach(element => { element.textContent = publicationSession?.interactionsAvailable ? '\u8FD1 7 \u65E5 \xB7 \u5168\u7AD9' : '\u8FD1 7 \u65E5 \xB7 \u672C\u6D4F\u89C8\u5668'; });
}

function insertPublicPlugins(items) {
  for (const item of items) {
    const existing = works.findIndex(work => work.id === item.id);
    if (existing >= 0) works[existing] = item; else works.push(item);
    const entries = item.kind === 'pet' ? petWorks : pluginWorks;
    const pluginIndex = entries.findIndex(work => work.id === item.id);
    if (pluginIndex >= 0) entries[pluginIndex] = item; else entries.push(item);
    if (!shuffledIds.includes(item.id)) shuffledIds.push(item.id);
  }
  const stored = readGalleryActivity();
  for (const item of items) if (!galleryActivity[item.id] && stored[item.id]) galleryActivity[item.id] = stored[item.id];
  if (['plugins', 'pets'].includes(route)) renderGallery();
  communityPages.refresh();
}

async function pluginShare(draft, workflow) {
  if (!draft.imported) throw new Error('\u8BF7\u5148\u4E0A\u4F20\u5B8C\u6574\u4F5C\u54C1\u6587\u4EF6\u3002');
  const info = inspectImportPackage(draft.imported.files, 'plugin');
  if (workflow === 'plugin-make' && info.report.level !== 'native') throw new Error('\u5236\u4F5C\u63D2\u4EF6\u9700\u7B26\u5408\u672C\u7CFB\u7EDF SDK \u5E76\u8865\u9F50\u58F0\u660E\u9644\u4EF6\uFF1B\u539F\u9879\u76EE\u683C\u5F0F\u8BF7\u4F7F\u7528\u201C\u5BFC\u5165\u63D2\u4EF6\u201D\u3002');
  const input = draft.fields;
  const credit = attribution(input);
  const files = prepareWorkPackage(draft.imported.files, input, 'plugin', workflow, draft.cover);
  if (workflow === 'plugin-make') await checkCreationImages(files, 'plugin');
  const archive = zipPackage(files);
  const name = \`\${String(input.id).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 64) || 'plugin'}-share.zip\`;
  return { archive, name, files, metadata: { title: input.title, name: input.title, id: input.id, description: input.description, ...credit, workflow } };
}

$('#plugin-download-backup').addEventListener('click', async () => {
  try { const shared = await pluginShare(captureDraft('plugin'), creatorWorkflow); download(shared.archive, shared.name); creatorFeedback('\u5206\u4EAB ZIP \u5DF2\u751F\u6210\u3002'); }
  catch (error) { creatorFeedback(error.message, true); }
});

async function publishCreator(event) {
  event.preventDefault();
  if (publicationBusy) return;
  const workflow = creatorWorkflow;
  const kind = workflow.split('-')[0], draft = captureDraft(kind);
  let shared, submissionWindow;
  $('#creator-submission-link').hidden = true;
  $('#creator-submission-link').removeAttribute('href');
  publicationBusy = true;
  updatePublicationUI();
  try {
    const repository = configuredSubmissionRepository(submissionRepository, publicationSession);
    if (repository) {
      // \u5728\u70B9\u51FB\u624B\u52BF\u4E2D\u9884\u7559\u9875\u9762\uFF0C\u5F02\u6B65\u6253\u5305\u540E\u518D\u6253\u5F00\u771F\u5B9E\u6295\u7A3F\u5730\u5740\u3002
      submissionWindow = window.open('about:blank', '_blank');
      if (submissionWindow) submissionWindow.opener = null;
      try { await draftStore('readwrite', workflow, draft); } catch { /* \u9875\u9762\u6587\u4EF6\u4E0E\u5B8C\u6574 ZIP \u4ECD\u53EF\u4FDD\u7559\u3002 */ }
      shared = kind === 'pet' ? await petShare(draft, workflow) : await pluginShare(draft, workflow);
      const digest = await crypto.subtle.digest('SHA-256', await shared.archive.arrayBuffer());
      const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const info = inspectImportPackage(shared.files, kind), manifest = info.manifest;
      const details = kind === 'pet' ? { actions: manifest?.mediaVersion === 1 ? \`\u5171 \${Object.keys(manifest.actions).length} \u4E2A\u52A8\u4F5C\u3002\u793A\u4F8B\uFF1A\${Object.keys(manifest.actions).slice(0, 12).join('\u3001')}\uFF1B\u5B8C\u6574\u540D\u79F0\u4E0E\u6620\u5C04\u4FDD\u7559\u5728\u5305\u5185\u3002\` : \`\${info.report.format}\uFF1B\u52A8\u4F5C\u4E0E\u540D\u79F0\u4EE5\u6240\u9644\u5B8C\u6574\u6E05\u5355\u548C\u7D20\u6750\u4E3A\u51C6\u3002\`, environment: \`\${info.report.format}\uFF1B\${info.report.level === 'native' ? '\u901A\u8FC7\u672C\u7CFB\u7EDF\u9759\u6001\u5305\u68C0\u67E5\uFF0C\u5B9E\u9645\u8FD0\u884C\u7531\u521B\u4F5C\u8005\u6D4B\u8BD5\u3002' : '\u5BFC\u5165\u4FDD\u6301\u539F\u9879\u76EE\uFF0C\u8FD0\u884C\u73AF\u5883\u4E0E\u884C\u4E3A\u4EE5\u5305\u5185\u8BF4\u660E\u4E3A\u51C6\u3002'}\` } : { version: typeof manifest?.version === 'string' ? manifest.version : '', permissions: Array.isArray(manifest?.permissions) ? manifest.permissions.length ? manifest.permissions.join('\u3001') : '\u6E05\u5355\u672A\u8BF7\u6C42\u6743\u9650\u3002' : '' };
      const href = githubSubmissionUrl(repository, shared.metadata, { name: shared.name, bytes: shared.archive.size, sha256 }, details);
      const link = $('#creator-submission-link'); link.href = href; link.hidden = false;
      download(shared.archive, shared.name);
      if (submissionWindow) submissionWindow.location.href = href;
      creatorFeedback(\`\u5B8C\u6574 ZIP \u4E0E\u4FDD\u5B58\u94FE\u63A5\u5DF2\u751F\u6210\u3002\u8BF7\u5728\u672C\u7AD9\u6295\u7A3F\u8868\u5355\u9644\u4E0A\u300C\${shared.name}\u300D\u5E76\u63D0\u4EA4\uFF0C\u5BA1\u6838\u6536\u5F55\u540E\u624D\u4F1A\u4E0A\u7EBF\u3002\${submissionWindow ? '' : '\u6D4F\u89C8\u5668\u672A\u6253\u5F00\u65B0\u9875\uFF0C\u53EF\u70B9\u51FB\u4E0A\u65B9\u201C\u6253\u5F00\u672C\u7AD9\u6295\u7A3F\u8868\u5355\u201D\u3002'}\`);
      return;
    }
    publicationSession = await publication.session();
    if (!publicationSession.available) throw new Error('\u5F53\u524D\u9875\u9762\u6CA1\u6709\u53D1\u5E03\u670D\u52A1\u3002\u6587\u4EF6\u4ECD\u5728\u672C\u6D4F\u89C8\u5668\uFF0C\u53EF\u4FDD\u5B58\u8349\u7A3F\u6216\u4E0B\u8F7D\u5206\u4EAB ZIP\u3002');
    if (!publicationSession.signedIn) {
      await draftStore('readwrite', workflow, draft);
      throw new Error('\u6295\u7A3F\u5165\u53E3\u5C1A\u672A\u5F00\u653E\u3002\u5F53\u524D\u4F5C\u54C1\u8349\u7A3F\u5DF2\u4FDD\u5B58\uFF0C\u53EF\u4E0B\u8F7D\u5B8C\u6574\u5206\u4EAB\u5305\u3002');
    }
    shared = kind === 'pet' ? await petShare(draft, workflow) : await pluginShare(draft, workflow);
    if (shared.archive.size > publicationSession.maxPackageBytes) throw new Error('\u516C\u5F00\u63D2\u4EF6 ZIP \u6700\u5927 32 MB\uFF0C\u8BF7\u7CBE\u7B80\u540E\u518D\u53D1\u5E03\uFF1B\u5B8C\u6574\u5206\u4EAB\u5305\u53EF\u5728\u4E0B\u65B9\u4E0B\u8F7D\u4FDD\u7559\u3002');
    try { await draftStore('readwrite', workflow, draft); } catch { /* \u5F53\u524D\u9875\u9762\u4ECD\u6301\u6709\u6587\u4EF6\uFF0C\u53D1\u5E03\u5931\u8D25\u65F6\u63D0\u4F9B ZIP \u4FDD\u7559\u3002 */ }
    const cover = draft.cover ? { ...draft.cover, ...coverImageType(draft.cover.bytes) } : kind === 'pet' ? await petCover(shared.files) : null;
    const item = await publication.publish(shared.metadata, shared.archive, cover);
    insertPublicPlugins([item]);
    creatorFeedback(\`\u300C\${item.title}\u300D\u5DF2\u53D1\u5E03\u5230\${kind === 'pet' ? '\u684C\u5BA0' : '\u63D2\u4EF6'}\u5E7F\u573A\uFF0C\u53EF\u6D4F\u89C8\u548C\u4E0B\u8F7D\u3002\`);
    toast('\u4F5C\u54C1\u5DF2\u53D1\u5E03\u5230\u516C\u5F00\u5E7F\u573A\u3002');
  } catch (error) {
    submissionWindow?.close();
    if (error.status === 401) {
      publicationSession = { ...publicationSession, available: true, signedIn: false };
      try { await draftStore('readwrite', workflow, draft); } catch { /* \u5206\u4EAB ZIP \u4ECD\u53EF\u4FDD\u7559\u5B8C\u6574\u6587\u4EF6\u3002 */ }
    }
    if (shared) download(shared.archive, shared.name);
    creatorFeedback(\`\u672A\u786E\u8BA4\u53D1\u5E03\uFF1A\${error.message}\${shared ? '\u3002\u5206\u4EAB ZIP \u5DF2\u751F\u6210\uFF0C\u53EF\u5148\u4E0B\u8F7D\u4FDD\u7559\u3002' : ''}\`, true);
  } finally { publicationBusy = false; updatePublicationUI(); }
}
$('#plugin-form').addEventListener('submit', publishCreator);
$('#pet-form').addEventListener('submit', publishCreator);

async function petCover(files) {
  const info = inspectImportPackage(files, 'pet');
  if (!info.report.capabilities.preview) return null;
  const file = info.assetPrefix + (info.manifest.mediaVersion === 1 ? info.manifest.actions.idle : info.manifest.spritesheetPath || 'spritesheet.webp');
  const bytes = files[file], canvas = document.createElement('canvas');
  let url, image;
  try {
    if (/\\.(mp4|webm)$/i.test(file)) {
      url = URL.createObjectURL(new Blob([bytes])); image = document.createElement('video'); image.muted = true; image.preload = 'auto'; image.src = url;
      await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('\u9884\u89C8\u8D85\u65F6')), 5000); image.onloadeddata = () => { clearTimeout(timer); resolve(); }; image.onerror = () => { clearTimeout(timer); reject(new Error('\u9884\u89C8\u65E0\u6CD5\u89E3\u7801')); }; });
      canvas.width = 192; canvas.height = 208; canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      image = await createImageBitmap(new Blob([bytes], { type: 'image/webp' })); canvas.width = 192; canvas.height = 208;
      const context = canvas.getContext('2d');
      if (info.manifest.mediaVersion === 1) context.drawImage(image, 0, 0, canvas.width, canvas.height); else context.drawImage(image, 0, 0, 192, 208, 0, 0, 192, 208);
    }
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    return blob ? { bytes: new Uint8Array(await blob.arrayBuffer()), mime: 'image/png', extension: 'png' } : null;
  } catch { return null; }
  finally { if (image instanceof HTMLVideoElement) { image.pause(); image.removeAttribute('src'); image.load(); } else image?.close(); if (url) URL.revokeObjectURL(url); }
}

async function refreshSharedActivity() {
  if (!publicationSession?.interactionsAvailable) return;
  try { const snapshot = await publication.activitySnapshot(); sharedActivity = snapshot.items; sharedContributorFollowers = snapshot.contributors; activitySnapshotAt = new Date().toISOString(); works.forEach(work => updateActivityDisplay(work.id)); communityPages.refresh(); }
  catch { toast('\u516C\u5171\u7EDF\u8BA1\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002'); }
}

async function initializePublication() {
  const results = await Promise.allSettled([publication.session(), publication.list(), publication.list('pet'), publication.activitySnapshot(), publication.requests()]);
  const [session, list, petList, activity, requests] = results;
  publicationSession = session.status === 'fulfilled' ? session.value : { available: false, signedIn: false, error: '\u53D1\u5E03\u670D\u52A1\u6682\u65F6\u65E0\u6CD5\u8FDE\u63A5\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5\u3002\u6587\u4EF6\u4E0D\u4F1A\u81EA\u52A8\u4E0A\u4F20\u3002' };
  publicListLoaded = list.status === 'fulfilled';
  if (list.status === 'fulfilled') insertPublicPlugins(list.value);
  if (petList.status === 'fulfilled') insertPublicPlugins(petList.value);
  if (publicationSession.interactionsAvailable) {
    if (activity.status === 'fulfilled') { sharedActivity = activity.value.items; sharedContributorFollowers = activity.value.contributors; activitySnapshotAt = new Date().toISOString(); }
    for (const work of works) if (!work.id.startsWith('community-')) work.download = \`/api/download/\${work.id}\`;
  }
  if (requests.status === 'fulfilled') communityPages.setPublicRequests(requests.value);
  if (publicationSession.available && (list.status === 'rejected' || petList.status === 'rejected')) toast('\u516C\u5F00\u4F5C\u54C1\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002');
  updatePublicationUI();
  renderRoute(); works.forEach(work => updateActivityDisplay(work.id));
}

async function draftStore(mode, kind, value) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('desktop-pet-creator-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('works');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('works', mode);
      const store = transaction.objectStore('works');
      const request = mode === 'readonly' ? store.get(kind) : store.put(value, kind);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('\u8349\u7A3F\u4FDD\u5B58\u4E2D\u65AD\u3002'));
    });
  } finally { database.close(); }
}

function captureDraft(kind) {
  const draft = { fields: Object.fromEntries(new FormData($(\`#\${kind}-form\`))), imported: importedPackages[kind], savedAt: new Date().toISOString() };
  if (kind === 'pet') Object.assign(draft, { petMode, mediaMode: $('#pet-media-mode').value, clips: clipMetadata().map(({ url, ...clip }) => clip), atlas: selectedAtlas ? { bytes: selectedAtlas.bytes, version: selectedAtlas.version } : null, bindings: Object.fromEntries(Array.from($('#state-bindings').querySelectorAll('select')).map(select => [select.dataset.state, select.value])), background: $('#clip-background').value, color: $('#clip-color').value });
  else draft.cover = pluginCover ? { bytes: pluginCover.bytes, path: pluginCover.path, mime: pluginCover.mime, origin: pluginCover.origin } : null;
  return draft;
}

function applyDraft(kind, draft) {
  ++uploadGenerations[kind];
  if (kind === 'pet') { ++atlasGeneration; ++clipGeneration; } else ++coverGeneration;
  const form = $(\`#\${kind}-form\`);
  form.reset();
  for (const [name, value] of Object.entries(draft.fields || {})) { const field = form.elements.namedItem(name); if (field && field.type !== 'file') field.value = value; }
  importedPackages[kind] = draft.imported || null;
  $(\`#\${kind}-compatibility\`).hidden = true;
  $(\`#\${kind}-package-status\`).textContent = '\u5C1A\u672A\u5BFC\u5165\u6587\u4EF6';
  $(\`#\${kind}-package-list\`).replaceChildren();
  if (kind === 'plugin') { setPluginCover(null); $('#permission-preview').textContent = '\u5BFC\u5165\u540E\u8BFB\u53D6\u6E05\u5355\uFF0C\u7F51\u9875\u4E0D\u4F1A\u6267\u884C\u4E0A\u4F20\u7684\u4EE3\u7801\u3002'; }
  else { $('[data-import-preview]').disabled = true; clearImportPreview(); }
  if (draft.imported) displayImportedPackage(kind);
  if (kind === 'pet') {
    $('#creator-pet-stage video')?.pause();
    clips.forEach(clip => URL.revokeObjectURL(clip.url));
    clips = (draft.clips || []).map(clip => ({ ...clip, url: URL.createObjectURL(new Blob([clip.bytes])) }));
    if (selectedAtlas) URL.revokeObjectURL(selectedAtlas.url);
    selectedAtlas = draft.atlas ? { ...draft.atlas, url: URL.createObjectURL(new Blob([draft.atlas.bytes], { type: 'image/webp' })) } : undefined;
    setPetMode(creatorWorkflow?.endsWith('import') ? 'import' : 'make');
    renderClips(); renderBindings(draft.bindings || {});
    $('#pet-media-mode').value = draft.mediaMode || 'video';
    $('#pet-media-mode').dispatchEvent(new Event('change'));
    $('#clip-background').value = draft.background || 'chroma';
    $('#clip-color').value = draft.color || '#00ff00';
    $('#clip-background').dispatchEvent(new Event('change'));
  } else if (Object.hasOwn(draft, 'cover')) setPluginCover(draft.cover);
  if (kind === 'plugin') renderPluginCardPreview();
}

document.querySelectorAll('[data-save-draft]').forEach(button => button.addEventListener('click', async () => {
  const kind = button.dataset.saveDraft;
  try {
    const draft = captureDraft(kind);
    await draftStore('readwrite', creatorWorkflow, draft);
    creatorFeedback('\u4F5C\u54C1\u4FE1\u606F\u4E0E\u5B8C\u6574\u6587\u4EF6\u5DF2\u4FDD\u5B58\u5230\u6B64\u6D4F\u89C8\u5668\u8349\u7A3F\u3002\u6CA1\u6709\u4E0A\u4F20\uFF1B\u6E05\u7406\u7F51\u7AD9\u6570\u636E\u4F1A\u5220\u9664\u8349\u7A3F\u3002');
  } catch (error) { creatorFeedback(\`\u8349\u7A3F\u672A\u4FDD\u5B58\uFF1A\${error.message}\u3002\u8BF7\u4E0B\u8F7D\u5206\u4EAB\u5305\u4FDD\u7559\u4F5C\u54C1\u3002\`, true); }
}));
document.querySelectorAll('[data-restore-draft]').forEach(button => button.addEventListener('click', async () => {
  const kind = button.dataset.restoreDraft;
  try {
    let draft = await draftStore('readonly', creatorWorkflow);
    let legacy = false;
    if (!draft) { draft = await draftStore('readonly', kind); legacy = Boolean(draft); }
    if (!draft) throw new Error('\u6B64\u6D4F\u89C8\u5668\u5C1A\u65E0\u8BE5\u7C7B\u578B\u8349\u7A3F\u3002');
    applyDraft(kind, draft);
    creatorFeedback(legacy ? '\u5DF2\u8BFB\u53D6\u65E7\u7248\u8349\u7A3F\uFF0C\u65E7\u8BB0\u5F55\u4FDD\u7559\u3002\u4FDD\u5B58\u540E\u5199\u5165\u5F53\u524D\u72EC\u7ACB\u5165\u53E3\uFF0C\u4E0D\u8986\u76D6\u65E7\u8349\u7A3F\u3002' : '\u5DF2\u6062\u590D\u5F53\u524D\u5165\u53E3\u7684\u4F5C\u54C1\u8349\u7A3F\u4E0E\u6587\u4EF6\uFF0C\u53EF\u7EE7\u7EED\u7F16\u8F91\u3002\u63D2\u4EF6\u53D1\u5E03\u4EE5\u670D\u52A1\u786E\u8BA4\u7ED3\u679C\u4E3A\u51C6\uFF0C\u684C\u5BA0\u4ECD\u53EF\u4E0B\u8F7D\u5206\u4EAB\u5305\u3002');
  } catch (error) { creatorFeedback(error.message, true); }
}));
$('#pet-media-mode').dispatchEvent(new Event('change'));
window.addEventListener('pagehide', () => { clips.forEach(clip => URL.revokeObjectURL(clip.url)); if (pluginCover?.url) URL.revokeObjectURL(pluginCover.url); clearImportPreview(); });
const communityPages = createCommunityPages({
  pets: petWorks, plugins: pluginWorks, activityFor, escapeHtml, icon, toast, copyGalleryText, download, publication, session: () => publicationSession, renderCard,
  statisticsSnapshot: () => ({ scope: publicationSession?.interactionsAvailable ? 'site' : 'browser', available: !publicationSession?.interactionsAvailable || sharedActivity !== null, updatedAt: activitySnapshotAt, contributors: publicationSession?.interactionsAvailable ? sharedContributorFollowers : null }),
  refreshStatistics: refreshSharedActivity,
  submissionRepository: () => configuredSubmissionRepository(submissionRepository, publicationSession),
  browseGallery(query, kind = 'pets') {
    location.hash = kind;
    renderRoute();
    if (typeof query === 'string') {
      $('#search').value = query;
      resetGallery();
    }
    $('#gallery-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
});
window.addEventListener('hashchange', renderRoute);
window.addEventListener('pagehide', () => {
  if (selectedAtlas) URL.revokeObjectURL(selectedAtlas.url);
  if (packageUrl) URL.revokeObjectURL(packageUrl);
  activeAnimations.forEach(animation => animation.cancel());
  clearTimeout(toastTimer);
});
renderRoute();
void initializePublication();

// AI \u6D4F\u89C8\u5668\u4E0E\u53EF\u89C1\u7B5B\u9009\u4F7F\u7528\u540C\u4E00\u4E2A\u72B6\u6001\u5165\u53E3\uFF0C\u4E0D\u8BFB\u53D6\u672C\u673A\u8D44\u6599\u3002
const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(modelContext.registerTool({
      name: 'filter_pet_gallery', title: '\u7B5B\u9009\u684C\u5BA0\u4E0E\u63D2\u4EF6\u5E7F\u573A',
      description: '\u5207\u6362\u684C\u5BA0\u6216\u63D2\u4EF6\u5E7F\u573A\u5E76\u7B5B\u9009\u5173\u952E\u8BCD\uFF0C\u53EA\u66F4\u65B0\u5F53\u524D\u7F51\u9875\u3002',
      inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['pets', 'plugins'] }, query: { type: 'string', maxLength: 120 } }, required: ['type'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || !['pets', 'plugins'].includes(input.type) || (input.query !== undefined && (typeof input.query !== 'string' || input.query.length > 120))) throw new Error('\u7B5B\u9009\u53C2\u6570\u65E0\u6548\u3002');
        location.hash = input.type;
        renderRoute();
        $('#search').value = input.query ?? '';
        resetGallery();
        return { type: route, result: $('#result-count').textContent };
      },
    }, { signal: lifecycle.signal })).catch(error => console.warn('\u5E7F\u573A\u5DE5\u5177\u6CE8\u518C\u672A\u5B8C\u6210', error.message));
  } catch (error) { console.warn('\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5E7F\u573A\u5DE5\u5177', error.message); }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
`,type:"text/javascript; charset=utf-8"},"/catalog.js":{body:`// \u753B\u5ECA\u4F5C\u54C1\u6765\u81EA\u56FA\u5B9A\u4E0A\u6E38\u63D0\u4EA4\uFF0C\u516C\u5F00\u56FE\u96C6\u9010\u9879\u6838\u5BF9 SHA-256\uFF1B\u4E0D\u5305\u542B\u7528\u6237\u79C1\u4EBA\u6863\u6848\u3002
export const actions = [
  [
    "\u5B89\u9759\u966A\u4F34",
    0,
    6,
    5500
  ],
  [
    "\u5411\u53F3\u6E9C\u8FBE",
    1,
    8,
    1060
  ],
  [
    "\u5411\u5DE6\u6E9C\u8FBE",
    2,
    8,
    1060
  ],
  [
    "\u6325\u624B",
    3,
    4,
    700
  ],
  [
    "\u8DF3\u8DC3",
    4,
    5,
    840
  ],
  [
    "\u5931\u8D25\u53CD\u5E94",
    5,
    8,
    1220
  ],
  [
    "\u7B49\u5F85",
    6,
    6,
    1000
  ],
  [
    "\u5DE5\u4F5C",
    7,
    6,
    820
  ],
  [
    "\u67E5\u770B",
    8,
    6,
    1030
  ]
];
export const templates = [
  {
    "id": "community.water-break",
    "title": "\u559D\u6C34\u5C0F\u63D0\u9192",
    "description": "\u5FD9\u788C\u7684\u65F6\u5019\uFF0C\u4E5F\u8BB0\u5F97\u559D\u53E3\u6C34\u3002\u95F4\u9694\u548C\u53F0\u8BCD\u90FD\u53EF\u91CD\u65B0\u521B\u4F5C\u3002",
    "everyMinutes": 45,
    "speech": "\u559D\u53E3\u6C34\uFF0C\u4F11\u606F\u4E00\u4E0B\u5427\u3002",
    "reaction": "waving",
    "category": "\u5065\u5EB7\u63D0\u9192",
    "symbol": "\u6C34"
  },
  {
    "id": "community.eye-break",
    "title": "\u8FDC\u773A\u4E00\u5206\u949F",
    "description": "\u628A\u89C6\u7EBF\u4ECE\u5C4F\u5E55\u79FB\u5F00\uFF0C\u8BA9\u773C\u775B\u548C\u684C\u5BA0\u4E00\u8D77\u4F11\u606F\u3002",
    "everyMinutes": 20,
    "speech": "\u770B\u770B\u8FDC\u5904\uFF0C\u8BA9\u773C\u775B\u4F11\u606F\u4E00\u4E0B\u3002",
    "reaction": "idle",
    "category": "\u5065\u5EB7\u63D0\u9192",
    "symbol": "\u76EE"
  },
  {
    "id": "community.focus-break",
    "title": "\u4E13\u6CE8\u540E\u4F11\u606F",
    "description": "\u6BCF\u9694\u4E00\u6BB5\u65F6\u95F4\u6E29\u548C\u63D0\u9192\u4F11\u606F\u3002\u5468\u671F\u91CD\u590D\u8FD0\u884C\uFF0C\u53EF\u5728\u672C\u5730\u505C\u7528\u3002",
    "everyMinutes": 25,
    "speech": "\u4E00\u6BB5\u4E13\u6CE8\u7ED3\u675F\u5566\uFF0C\u7AD9\u8D77\u6765\u6D3B\u52A8\u4E00\u4E0B\u3002",
    "reaction": "celebrating",
    "category": "\u4E13\u6CE8\u966A\u4F34",
    "symbol": "\u6B47"
  }
];
export const catCredit = {
  "author": "OpenPets \u4E0A\u6E38\u793A\u4F8B\uFF1B\u5177\u4F53\u4F5C\u8005\u5F85\u6838\u5B9E",
  "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4",
  "license": "\u5355\u9879\u7D20\u6750\u8BB8\u53EF\u5F85\u6838\u5B9E\uFF0C\u4ED3\u5E93\u4EE3\u7801\u8BB8\u53EF\u4E3A MIT"
};
// \u663E\u793A\u7F72\u540D\u4E0E\u5DF2\u6279\u51C6\u7684\u771F\u5B9E GitHub \u8D26\u6237\u5206\u522B\u4FDD\u7559\uFF0C\u4E0D\u6539\u4E0A\u6E38\u7F72\u540D\u3002
export const projectAuthor = 'Lykinzlj';
export const projectAuthorUrl = 'https://github.com/xunguangzlj-cloud';
export const templateCredit = {
  "author": projectAuthor,
  "source": "desktop pet \u58F0\u660E\u5F0F\u63D2\u4EF6\u683C\u5F0F",
  "license": "MIT\uFF08\u63D0\u9192\u6E05\u5355\u4EE3\u7801\uFF09"
};
export const cat = {
  "id": "hoodie-cat-openpets",
  "title": "Hoodie Cat",
  "description": "\u7A7F\u7740\u8FDE\u5E3D\u886B\u7684\u732B\u54AA\uFF0C\u62E5\u6709\u6E9C\u8FBE\u3001\u6325\u624B\u3001\u8DF3\u8DC3\u548C\u6CE8\u89C6\u52A8\u4F5C\u3002",
  "category": "\u52A8\u7269\u4F19\u4F34",
  "author": "OpenPets \u4E0A\u6E38\u793A\u4F8B",
  "kind": "pet",
  "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4",
  "license": "\u5355\u9879\u7D20\u6750\u8BB8\u53EF\u5F85\u6838\u5B9E\uFF0C\u4ED3\u5E93\u4EE3\u7801\u8BB8\u53EF\u4E3A MIT",
  "englishTitle": "Hoodie Cat",
  "atlas": "assets/hoodie.webp",
  "thumbnail": "assets/pets/hoodie-cat-openpets-thumb.webp",
  "version": 2,
  "authorHandle": "",
  "authorUrl": "https://github.com/OpenPetsHQ",
  "tags": [
    "\u732B\u54AA",
    "\u8FDE\u5E3D\u886B",
    "\u52A8\u7269\u4F19\u4F34"
  ],
  "download": "assets/hoodie-cat-openpets.zip",
  "date": "",
  "importedAt": "2026-10-07",
  "collections": []
};
export const pets = [
  {
    "id": "firefly--lingxiaotian",
    "title": "\u6D41\u8424",
    "englishTitle": "Firefly",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u6D41\u8424\u53D8\u8EAB\u524D\u7684\u4EBA\u7C7B\u5F62\u6001 Codex \u6570\u7801\u5BA0\u7269\uFF0C\u6E29\u67D4\u3001\u8F7B\u76C8\u3001\u767D\u7EFF\u91D1\u914D\u8272\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/firefly--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/firefly--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "firefly",
      "white-hair",
      "mint-green"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/firefly--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/firefly--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/firefly--lingxiaotian",
    "spritesheetSha256": "bd0a0deea6bfac69cfd6ebbec02e254536a6276a3958e5794a1b256aed074583",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "acheron--lingxiaotian",
    "title": "\u9EC4\u6CC9",
    "englishTitle": "Acheron",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9EC4\u6CC9\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u9ED1\u957F\u53D1\u3001\u7EA2\u8272\u53D1\u9970\u3001\u767D\u9ED1\u670D\u88C5\u548C\u51B7\u9759\u950B\u5229\u7684\u5200\u7CFB\u6C14\u8D28\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/acheron--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/acheron--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "acheron",
      "sword",
      "purple"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/acheron--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/acheron--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/acheron--lingxiaotian",
    "spritesheetSha256": "fc34319c614cebcfbd7efabb10b9bcebaef039bc487c243402b791f607c9cfda",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "aemeath-mini--cunuo",
    "title": "Aemeath Mini",
    "englishTitle": "Aemeath Mini",
    "description": "A Q-style pixel Aemeath companion with soft expressions and small animated desktop-pet motions.",
    "category": "\u5409\u7965\u7269",
    "author": "cuNuo",
    "authorHandle": "cuNuo",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/aemeath-mini--cunuo.webp",
    "thumbnail": "assets/pets/upstream-20261009/aemeath-mini--cunuo-thumb.webp",
    "version": 1,
    "tags": [
      "aemeath",
      "pixel-art",
      "q-style",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/aemeath-mini--cunuo",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/aemeath-mini--cunuo.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/aemeath-mini--cunuo",
    "spritesheetSha256": "f6b2677b8e16bf1b73b0425e60bb6439bac803e108e073ef9b9dc128a762a1dc",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/cuNuo"
  },
  {
    "id": "apu--xchangee",
    "title": "Apu",
    "englishTitle": "Apu",
    "description": "A round blue-and-yellow helper pet with a little hat, soft expressions, and cheerful Codex work animations.",
    "category": "\u5409\u7965\u7269",
    "author": "tal",
    "authorHandle": "xchangee",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/apu--xchangee.webp",
    "thumbnail": "assets/pets/upstream-20261009/apu--xchangee-thumb.webp",
    "version": 1,
    "tags": [
      "apu",
      "helper",
      "round",
      "cute",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/apu--xchangee",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/apu--xchangee.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/apu--xchangee",
    "spritesheetSha256": "315868428da4962bc38bc9ce0c5e6c1ff7e52bd548b3e5ef1a527469b73f1ab6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/xchangee"
  },
  {
    "id": "arlecchino--lingxiaotian",
    "title": "\u963F\u857E\u5947\u8BFA",
    "englishTitle": "Arlecchino",
    "description": "\u300A\u539F\u795E\u300B\u963F\u857E\u5947\u8BFA\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9ED1\u767D\u7EA2\u914D\u8272\u3001\u77ED\u62AB\u98CE\u4E0E\u51B7\u5CFB\u950B\u5229\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/arlecchino--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/arlecchino--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "arlecchino",
      "black-white-red",
      "stern"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arlecchino--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/arlecchino--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/arlecchino--lingxiaotian",
    "spritesheetSha256": "aa311d2686e3a8fc7edbbbcaff2e824f821582a27694d7385c2c1416de6622e4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "becky--natewanggg",
    "title": "Becky",
    "englishTitle": "Becky",
    "description": "A slim dark-gray mackerel tabby Codex pet based on Becky, with curled ears, very round pale yellow eyes, black paw pads, and a thin ring-striped tail.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "NateWanggg",
    "authorHandle": "NateWanggg",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/becky--natewanggg.webp",
    "thumbnail": "assets/pets/upstream-20261009/becky--natewanggg-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "tabby",
      "becky",
      "original-pet",
      "dark-gray"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/becky--natewanggg",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/becky--natewanggg.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/becky--natewanggg",
    "spritesheetSha256": "8e76db46a3712cabf22e426202307d8467f925d3f40d9116070345095add04f6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/NateWanggg"
  },
  {
    "id": "black-swan--lingxiaotian",
    "title": "\u9ED1\u5929\u9E45",
    "englishTitle": "Black Swan",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9ED1\u5929\u9E45\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7EB1\u5E3D\u3001\u7D2B\u9ED1\u793C\u670D\u4E0E\u795E\u79D8\u5360\u535C\u5E08\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/black-swan--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/black-swan--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "black-swan",
      "mystic",
      "veil"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/black-swan--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/black-swan--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/black-swan--lingxiaotian",
    "spritesheetSha256": "531944d7a896777932ee15ea2480874e15a9112dc6319b4243e380de31c53ab5",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "bubu--gbn666",
    "title": "Bubu",
    "englishTitle": "Bubu",
    "description": "A soft, sleepy milk-tea-brown chibi bear desktop pet with warm cheek patches and relaxed pixel-art motions.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "Guo Beining",
    "authorHandle": "gbn666",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/bubu--gbn666.webp",
    "thumbnail": "assets/pets/upstream-20261009/bubu--gbn666-thumb.webp",
    "version": 1,
    "tags": [
      "bear",
      "chibi",
      "pixel-art",
      "sleepy",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu--gbn666",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/bubu--gbn666.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/bubu--gbn666",
    "spritesheetSha256": "6eecf5d23b066a24172017232144f717e674c6a493d12de126399837ef22db6f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/gbn666"
  },
  {
    "id": "buttercup--legeling",
    "title": "\u6BDB\u6BDB",
    "englishTitle": "Buttercup",
    "description": "A classic green Powerpuff Girl with black flipped hair and a confident expression.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/buttercup--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/buttercup--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "powerpuff-girls",
      "buttercup"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/buttercup--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/buttercup--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/buttercup--legeling",
    "spritesheetSha256": "8eadf67be926a4c3fca15daac6844022c9582421bc690e93e32523386f5d8635",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "castorice--lingxiaotian",
    "title": "\u9050\u8776",
    "englishTitle": "Castorice",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9050\u8776\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u9ED1\u914D\u8272\u3001\u8776\u5F62\u610F\u8C61\u3001\u957F\u53D1\u8F6E\u5ED3\u548C\u67D4\u548C\u795E\u79D8\u6C14\u8D28\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/castorice--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/castorice--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "castorice",
      "butterfly",
      "purple"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/castorice--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/castorice--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/castorice--lingxiaotian",
    "spritesheetSha256": "99c0b3504aad7f38dd239cae49412ed39a4c23ae3c24fd052e83a74bb6866372",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "chud-codex--jorge-cuevas90003",
    "title": "Chud Codex",
    "englishTitle": "Chud Codex",
    "description": "An original grimdark chibi sci-fi cadet in black-and-brass armor with a glowing red visor and an absurdly serious attitude.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Jorge",
    "authorHandle": "Jorge-Cuevas90003",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.webp",
    "thumbnail": "assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003-thumb.webp",
    "version": 2,
    "tags": [
      "grimdark",
      "sci-fi",
      "cadet",
      "armored",
      "chibi",
      "original",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/chud-codex--jorge-cuevas90003",
    "license": "CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge; no third-party source assets were used.",
    "download": "assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/chud-codex--jorge-cuevas90003",
    "spritesheetSha256": "e1211e3317065e70ef342f97fcc37337036c1e41ab2818db5c8c378c976dfc79",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jorge-Cuevas90003"
  },
  {
    "id": "citlali--zaytsevzy",
    "title": "\u831C\u7279\u83C8\u8389",
    "englishTitle": "Citlali",
    "description": "\u5750\u5728\u4F0A\u5179\u5E15\u5E15\u4E0A\u7684\u50CF\u7D20\u831C\u7279\u83C8\u8389\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "ZaytsevZY",
    "authorHandle": "ZaytsevZY",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/citlali--zaytsevzy.webp",
    "thumbnail": "assets/pets/upstream-20261009/citlali--zaytsevzy-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "genshin-impact",
      "citlali",
      "pixel-art",
      "reading"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/citlali--zaytsevzy",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/citlali--zaytsevzy.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/citlali--zaytsevzy",
    "spritesheetSha256": "9fbe935730ba52af3e80a41e6a698391b73d2a872c9fcf2a7ce9c44e9ec98ed3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ZaytsevZY"
  },
  {
    "id": "claude--xiangking",
    "title": "Claude",
    "englishTitle": "Claude",
    "description": "A tiny orange blocky digital pet with stubby side arms, short legs, and expressive pixel-art poses.",
    "category": "\u5409\u7965\u7269",
    "author": "XiangWang",
    "authorHandle": "xiangking",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/claude--xiangking.webp",
    "thumbnail": "assets/pets/upstream-20261009/claude--xiangking-thumb.webp",
    "version": 1,
    "tags": [
      "orange",
      "pixel-art",
      "blocky",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/claude--xiangking",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/claude--xiangking.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/claude--xiangking",
    "spritesheetSha256": "ddab2df6b9f7c52267f6baad85d4c3a5ccceccae6ac1b0f325e97bb5348e0e75",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/xiangking"
  },
  {
    "id": "codexy--z19t",
    "title": "\u7801\u7075",
    "englishTitle": "Codexy",
    "description": "An original mint-haired Codex AI assistant with hardworking task animations and a complete 16-direction look loop.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "z19t",
    "authorHandle": "z19t",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/codexy--z19t.webp",
    "thumbnail": "assets/pets/upstream-20261009/codexy--z19t-thumb.webp",
    "version": 2,
    "tags": [
      "ai-assistant",
      "anime",
      "coding",
      "codex",
      "mint-hair",
      "original",
      "terminal-companion",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/codexy--z19t",
    "license": "CC BY-NC 4.0. Original AI-generated artwork independently created and adapted by z19t; non-commercial use only.",
    "download": "assets/pets/upstream-20261009/codexy--z19t.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/codexy--z19t",
    "spritesheetSha256": "e65f68c7e7f9c8dc858e8d601f39bbe4942e3dbb889d61a06868c69289f8d1e4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/z19t"
  },
  {
    "id": "corgi-companion--cxian0928-afk",
    "title": "Corgi Companion",
    "englishTitle": "Corgi Companion",
    "description": "A cheerful corgi companion with bright ears, a friendly grin, and playful laptop-working poses.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "cxian0928-afk",
    "authorHandle": "cxian0928-afk",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.webp",
    "thumbnail": "assets/pets/upstream-20261009/corgi-companion--cxian0928-afk-thumb.webp",
    "version": 1,
    "tags": [
      "corgi",
      "dog",
      "orange",
      "cute",
      "laptop",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/corgi-companion--cxian0928-afk",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/corgi-companion--cxian0928-afk",
    "spritesheetSha256": "7ce091d553f8c52608c80f0d61a602cd50f13459d912e1c9a9862694a77fec40",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/cxian0928-afk"
  },
  {
    "id": "crt-monitor--wxy",
    "title": "CRT \u663E\u793A\u5668",
    "englishTitle": "CRT Monitor",
    "description": "A tiny retro CRT monitor that keeps an eye on your code.",
    "category": "\u673A\u5668\u4EBA",
    "author": "wxy",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/crt-monitor--wxy.webp",
    "thumbnail": "assets/pets/upstream-20261009/crt-monitor--wxy-thumb.webp",
    "version": 2,
    "tags": [
      "robot",
      "retro-computing",
      "crt",
      "coding"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/crt-monitor--wxy",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/crt-monitor--wxy.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/crt-monitor--wxy",
    "spritesheetSha256": "4027e21fb235f5bc5eb992e711531dfb2ac3641eeb1056e21e338c1b28806970",
    "metadataNameAlias": false
  },
  {
    "id": "cyrene--lingxiaotian",
    "title": "\u6614\u6D9F",
    "englishTitle": "Cyrene",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u6614\u6D9F\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7C89\u767D\u957F\u53D1\u3001\u767D\u7C89\u84DD\u793C\u88D9\u3001\u7FBD\u53F6\u72B6\u5934\u9970\u4E0E\u8F7B\u76C8\u68A6\u5E7B\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/cyrene--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/cyrene--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "cyrene",
      "pink",
      "dreamy"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/cyrene--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/cyrene--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/cyrene--lingxiaotian",
    "spritesheetSha256": "451b409ab66cc60ab1e7f06136a0cb8c76dbb147816c779d57675912becb36b0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "desk-otter--zihualiu1997",
    "title": "Desk Otter",
    "englishTitle": "Desk Otter",
    "description": "A bespectacled desk-worker otter mascot in a blue shirt, animated for Codex task states.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "zihualiu1997",
    "authorHandle": "zihualiu1997",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/desk-otter--zihualiu1997.webp",
    "thumbnail": "assets/pets/upstream-20261009/desk-otter--zihualiu1997-thumb.webp",
    "version": 1,
    "tags": [
      "otter",
      "desk-worker",
      "glasses",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/desk-otter--zihualiu1997",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/desk-otter--zihualiu1997.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/desk-otter--zihualiu1997",
    "spritesheetSha256": "e48f36365aab834bcd8f6fd21a21727eced21fb1ff2940bf5e5980bebe85e18e",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zihualiu1997"
  },
  {
    "id": "diandian--lllucasxu",
    "title": "Diandian",
    "englishTitle": "Diandian",
    "description": "A calm tabby-and-white cat companion with a sleepy face and gentle curled-up poses.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "LLLucasXU",
    "authorHandle": "LLLucasXU",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/diandian--lllucasxu.webp",
    "thumbnail": "assets/pets/upstream-20261009/diandian--lllucasxu-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "tabby",
      "sleepy",
      "calm",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diandian--lllucasxu",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/diandian--lllucasxu.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/diandian--lllucasxu",
    "spritesheetSha256": "276cd3263e708dd43ca03919305dd75827b99d0d9012e70a8cf5b4be502714d4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/LLLucasXU"
  },
  {
    "id": "diaoyi-baobao--d1a0y1bb",
    "title": "Diaoyi Baobao",
    "englishTitle": "Diaoyi Baobao",
    "description": "A tiny green clover-like companion with a round face and gentle, cheerful expressions.",
    "category": "\u5409\u7965\u7269",
    "author": "D1a0y1bb",
    "authorHandle": "D1a0y1bb",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.webp",
    "thumbnail": "assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb-thumb.webp",
    "version": 1,
    "tags": [
      "clover",
      "green",
      "mascot",
      "cute",
      "round",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diaoyi-baobao--d1a0y1bb",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/diaoyi-baobao--d1a0y1bb",
    "spritesheetSha256": "585e5c3f39021699d7671a450d9e9b77f1f73d0099560fcbdbed2e457a917bc6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/D1a0y1bb"
  },
  {
    "id": "doro--lingxiaotian",
    "title": "\u6843\u4E50\u4E1D\uFF08Doro\uFF09",
    "englishTitle": "Doro",
    "description": "A compact Codex digital pet inspired by Doro, the vacant pink-haired Dorothy meme creature from Goddess of Victory: NIKKE.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/doro--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/doro--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "nikke",
      "doro",
      "dorothy",
      "meme",
      "pink-hair"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/doro--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/doro--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "nikke"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/doro--lingxiaotian",
    "spritesheetSha256": "f0661f6f0b1297e54d40a33f0ecfa5c8ef76c88d5b92c4edd7dd76e9ca99872c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "evanescia-lunar-blossoming--jasdfgh",
    "title": "\u7EEF\u82F1 \xB7 \u6708\u5F85\u82B1\u65F6",
    "englishTitle": "Evanescia \xB7 Lunar Blossoming",
    "description": "\u6C89\u8FF7\u6F2B\u753B\u7684\u8BFB\u8005\uFF0C\u70ED\u8877\u796D\u5178\u7684\u6E38\u5BA2  \uFF0C\u4EA6\u662F\u5E7B\u6708\u6E38\u620F\u7684\u5B88\u62A4\u8005\u3002\u7EEF\u82F1\u6362\u4E0A\u300C\u6708\u5F85\u82B1\u65F6\u300D\uFF0C\u7B11\u91CC\u85CF\u4E09\u5206\u72E1\u9EE0\uFF0C\u8170\u95F4\u60AC\u4E00\u67C4\u5C3A\u5203\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "Jasdfgh",
    "authorHandle": "Jasdfgh",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.webp",
    "thumbnail": "assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh-thumb.webp",
    "version": 2,
    "tags": [
      "honkai-star-rail",
      "anime",
      "chibi",
      "pink"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/evanescia-lunar-blossoming--jasdfgh",
    "license": "CC BY-NC 4.0 for the submitter's licensable contributions; non-commercial use only. Original Honkai: Star Rail / HoYoverse character, outfit, and other third-party intellectual property are excluded. Unofficial fan art; no official affiliation or endorsement.",
    "download": "assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/evanescia-lunar-blossoming--jasdfgh",
    "spritesheetSha256": "b3ffe93e45b846fce1559471f66cb5328994ea6a4c7f72fbb0cc91914a68a072",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jasdfgh"
  },
  {
    "id": "feixiao--lingxiaotian",
    "title": "\u98DE\u9704",
    "englishTitle": "Feixiao",
    "description": "\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u98DE\u9704\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u5C06\u519B\u8F6E\u5ED3\u3001\u9752\u767D\u914D\u8272\u3001\u5229\u843D\u8FD0\u52A8\u59FF\u6001\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/feixiao--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/feixiao--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "feixiao",
      "teal",
      "general"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/feixiao--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/feixiao--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/feixiao--lingxiaotian",
    "spritesheetSha256": "7ad0f3f3561e8056b195b11e95090fb228b9bcb0fb3958725ce1380d4353f7e1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "fleta--natewanggg",
    "title": "Fleta",
    "englishTitle": "Fleta",
    "description": "A cute pixel-art-adjacent Codex pet based on Fleta, a plush silver-white cat with round cheeks, big blue-gray eyes, tiny paws, and soft gray shading.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "NateWanggg",
    "authorHandle": "NateWanggg",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/fleta--natewanggg.webp",
    "thumbnail": "assets/pets/upstream-20261009/fleta--natewanggg-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "silver-white",
      "fleta",
      "original-pet",
      "soft"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/fleta--natewanggg",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/fleta--natewanggg.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/fleta--natewanggg",
    "spritesheetSha256": "e50eaf9d33e425fee880de1a7715606a729f478ca926def0ead5f3e8240e3a2d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/NateWanggg"
  },
  {
    "id": "frankie--aygunvarol",
    "title": "Frankie",
    "englishTitle": "Frankie",
    "description": "A cute sausage dog companion with a long dachshund body, floppy ears, and bright friendly eyes.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "Aygun Varol",
    "authorHandle": "AygunVarol",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/frankie--aygunvarol.webp",
    "thumbnail": "assets/pets/upstream-20261009/frankie--aygunvarol-thumb.webp",
    "version": 1,
    "tags": [
      "dachshund",
      "dog",
      "sausage-dog",
      "cute",
      "brown",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frankie--aygunvarol",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/frankie--aygunvarol.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/frankie--aygunvarol",
    "spritesheetSha256": "93d4bd6c9cb42ca7a18a71cbe2ee3587a2a8973f41a8d65e760f1328879e8aa1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/AygunVarol"
  },
  {
    "id": "frieren--lingxiaotian",
    "title": "\u8299\u8389\u83B2",
    "englishTitle": "Frieren",
    "description": "A compact Codex digital pet inspired by Frieren, a calm elven mage companion.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/frieren--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/frieren--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "elf",
      "mage",
      "fantasy",
      "frieren"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frieren--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/frieren--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "frieren"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/frieren--lingxiaotian",
    "spritesheetSha256": "539f740b954e499ffd56f837cfe0afe4a522e56fe9c9dde134f50b7252a4a7b9",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "furina--lingxiaotian",
    "title": "\u8299\u5B81\u5A1C",
    "englishTitle": "Furina",
    "description": "\u300A\u539F\u795E\u300B\u8299\u5B81\u5A1C\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u84DD\u767D\u793C\u5E3D\u3001\u821E\u53F0\u611F\u548C\u4FCF\u76AE\u620F\u5267\u8868\u60C5\u3002.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/furina--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/furina--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "furina",
      "fontaine",
      "theatrical"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/furina--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/furina--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/furina--lingxiaotian",
    "spritesheetSha256": "91cb4fbb0dc747783e83cb6d09e58476c6adc7d53dd8294c1d609e975c93b99a",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "golden-lamp--legeling",
    "title": "Golden Lamp",
    "englishTitle": "Golden Lamp",
    "description": "An AI-generated golden-lamp sprite based on the reference supplied in request #149. Sprite-only lamp interpretation; the intended request subject and remaining request scope are unresolved pending requester confirmation.",
    "category": "\u5176\u4ED6",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/golden-lamp--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/golden-lamp--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "gold-lamp",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/golden-lamp--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only; commercial use is prohibited. Rights in the requester-supplied reference image and any depicted or referenced characters remain with their respective rights holders. This is an unofficial AI-generated community interpretation.",
    "download": "assets/pets/upstream-20261009/golden-lamp--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/golden-lamp--legeling",
    "spritesheetSha256": "bad38befd0eaccf0ce9f96adfc08eced1a1cd9d865317dffbdc40efb51539024",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "hajimi--zeyuwang1999",
    "title": "Hajimi",
    "englishTitle": "Hajimi",
    "description": "A cute purple-haired cat-eared companion with soft expressions and Codex-optimized desktop-pet animations.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "zeyu.wang",
    "authorHandle": "zeyuwang1999",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hajimi--zeyuwang1999.webp",
    "thumbnail": "assets/pets/upstream-20261009/hajimi--zeyuwang1999-thumb.webp",
    "version": 1,
    "tags": [
      "hajimi",
      "cat-ears",
      "purple",
      "cute",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hajimi--zeyuwang1999",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/hajimi--zeyuwang1999.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hajimi--zeyuwang1999",
    "spritesheetSha256": "0a203ff15f0cdd503b54743c5d27c4d67c355c2359f91ceedacf449493e11a4f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zeyuwang1999"
  },
  {
    "id": "hana2--initiatione",
    "title": "Hana2",
    "englishTitle": "Hana2",
    "description": "A refined kimono-style Hana pixel pet with gentle expressions, floral details, and calm desktop-pet animations.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "initiatione",
    "authorHandle": "initiatione",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hana2--initiatione.webp",
    "thumbnail": "assets/pets/upstream-20261009/hana2--initiatione-thumb.webp",
    "version": 1,
    "tags": [
      "hana",
      "kimono",
      "pixel-art",
      "gentle",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hana2--initiatione",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/hana2--initiatione.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hana2--initiatione",
    "spritesheetSha256": "ddbc017778f7824709cc0b9d2774022c18486b4449f47073891e406b2e5712af",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/initiatione"
  },
  {
    "id": "hu-tao--lingxiaotian",
    "title": "\u80E1\u6843",
    "englishTitle": "Hu Tao",
    "description": "\u300A\u539F\u795E\u300B\u80E1\u6843\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u5F80\u751F\u5802\u5E3D\u5B50\u3001\u6885\u82B1\u773C\u4E0E\u4FCF\u76AE\u7075\u52A8\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hu-tao--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/hu-tao--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "hu-tao",
      "black-red",
      "playful"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hu-tao--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/hu-tao--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hu-tao--lingxiaotian",
    "spritesheetSha256": "9dc7651a1d8b7074ff9d506ef57059805b6c3e23d15841dc54199292c7fce183",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "iris--yau-427",
    "title": "Iris",
    "englishTitle": "Iris",
    "description": "A cheerful manga-pop companion who works at her laptop inside a chunky neon terminal window.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Yau-427",
    "authorHandle": "Yau-427",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/iris--yau-427.webp",
    "thumbnail": "assets/pets/upstream-20261009/iris--yau-427-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "manga-pop",
      "cyberpunk",
      "neon",
      "coding",
      "terminal",
      "coffee",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iris--yau-427",
    "license": "MIT License; original AI-assisted artwork submitted by Yau-427 with redistribution permission.",
    "download": "assets/pets/upstream-20261009/iris--yau-427.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/iris--yau-427",
    "spritesheetSha256": "9549db84e558ecc3477853c95b81a84f50447ccd32566ff5cf22520f2785b9da",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Yau-427"
  },
  {
    "id": "isekaijoucho--siiverash",
    "title": "Isekaijoucho",
    "englishTitle": "Isekaijoucho",
    "description": "An Isekaijoucho-inspired fan-art Codex pet with long wavy silver hair, a vivid blue flower ornament, a white-and-ice-blue dress palette, and a compact chibi pixel sprite identity.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "SiIverAsh",
    "authorHandle": "SiIverAsh",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/isekaijoucho--siiverash.webp",
    "thumbnail": "assets/pets/upstream-20261009/isekaijoucho--siiverash-thumb.webp",
    "version": 1,
    "tags": [
      "kamitsubaki-studio",
      "isekaijoucho",
      "virtual-singer",
      "pixel-art",
      "hatch-pet"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/isekaijoucho--siiverash",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/isekaijoucho--siiverash.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "kamitsubaki-studio"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/isekaijoucho--siiverash",
    "spritesheetSha256": "6863ba09b86a8a8f50bdf90e07ac149ea0c9269c1e2e6323b60d29dfd58cb2a1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/SiIverAsh"
  },
  {
    "id": "joker--oytyo",
    "title": "Joker",
    "englishTitle": "Joker",
    "description": "A pixel-art theatrical card trickster in a tailored purple-black suit with green-black hair, painted eyes, playing-card animations, and 16-way looking directions.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "oYTYo",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/joker--oytyo.webp",
    "thumbnail": "assets/pets/upstream-20261009/joker--oytyo-thumb.webp",
    "version": 2,
    "tags": [
      "pixel-art",
      "card-trickster",
      "theatrical",
      "playing-cards"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/joker--oytyo",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/joker--oytyo.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/joker--oytyo",
    "spritesheetSha256": "39b74779641dd5cbe1947ee1f1463c8fbeffc66e8793c014696bbe67935f1cef",
    "metadataNameAlias": false
  },
  {
    "id": "kamisato-ayaka--lingxiaotian",
    "title": "\u795E\u91CC\u7EEB\u534E",
    "englishTitle": "Kamisato Ayaka",
    "description": "\u300A\u539F\u795E\u300B\u795E\u91CC\u7EEB\u534E\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u84DD\u767D\u914D\u8272\u3001\u516C\u4E3B\u5207\u8F6E\u5ED3\u4E0E\u5B89\u9759\u4F18\u96C5\u7684\u7A3B\u59BB\u5927\u5C0F\u59D0\u6C14\u8D28\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "kamisato-ayaka",
      "cryo",
      "blue"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kamisato-ayaka--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/kamisato-ayaka--lingxiaotian",
    "spritesheetSha256": "2e4a779f8a1d8c8ab4199d4ccf4f0f609bd1307323bfea7005bf5b73fe259f58",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "katana-cheems--thankyou-cheems",
    "title": "Katana Cheems",
    "englishTitle": "Katana Cheems",
    "description": "A pixel-art Cheems pet wearing a straw hat, carrying a tiny katana, and crying a blue meme tear when a Codex task fails.",
    "category": "\u7F51\u7EDC\u6897\u56FE",
    "author": "Thankyou-Cheems",
    "authorHandle": "Thankyou-Cheems",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.webp",
    "thumbnail": "assets/pets/upstream-20261009/katana-cheems--thankyou-cheems-thumb.webp",
    "version": 1,
    "tags": [
      "cheems",
      "dog",
      "shiba",
      "katana",
      "straw-hat",
      "pixel-art",
      "meme",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/katana-cheems--thankyou-cheems",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/katana-cheems--thankyou-cheems",
    "spritesheetSha256": "467ada74e238f6b27b85a010e6825eb0e3e8dd864d9f0143849e60301bd9498e",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Thankyou-Cheems"
  },
  {
    "id": "kiko--untko",
    "title": "Kiko",
    "englishTitle": "Kiko",
    "description": "A cheerful color-changing gecko companion with expressive animations and curious eyes.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "untko",
    "authorHandle": "untko",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/kiko--untko.webp",
    "thumbnail": "assets/pets/upstream-20261009/kiko--untko-thumb.webp",
    "version": 2,
    "tags": [
      "gecko",
      "animal",
      "3d-toy",
      "color-changing",
      "expressive",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kiko--untko",
    "license": "CC BY-NC 4.0. The creator owns or controls the Kiko artwork and authorizes its redistribution and modification under CC BY-NC 4.0, without warranty.",
    "download": "assets/pets/upstream-20261009/kiko--untko.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/kiko--untko",
    "spritesheetSha256": "dadeab52face9c15e29a9e5e28ae3860b9634ebf4ce7aca42b59c484bd6f3a2f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/untko"
  },
  {
    "id": "kurimanju--legeling",
    "title": "\u6817\u5B50\u9992\u5934",
    "englishTitle": "Kurimanju",
    "description": "The flushed brown-crowned Chiikawa character with four blush strokes on each cheek.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/kurimanju--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/kurimanju--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "chiikawa",
      "kurimanju"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kurimanju--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/kurimanju--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/kurimanju--legeling",
    "spritesheetSha256": "aeba2fd4e4e9290c8f794decf68563176bef816e313d0cafc6e30c6ef1122cb2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "lil-swole--gg0805",
    "title": "Lil Swole",
    "englishTitle": "Lil Swole",
    "description": "A cultured, gloriously brainrotted gym-rat icon who curls a computer mouse while his parrot wingman launches dumbbells.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "gg0805",
    "authorHandle": "gg0805",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/lil-swole--gg0805.webp",
    "thumbnail": "assets/pets/upstream-20261009/lil-swole--gg0805-thumb.webp",
    "version": 2,
    "tags": [
      "rat",
      "gym",
      "streetwear",
      "parrot",
      "sticker",
      "original",
      "codex-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lil-swole--gg0805",
    "license": "CC BY-NC 4.0. Original AI-generated artwork created for and submitted by gg0805; no third-party source assets were used.",
    "download": "assets/pets/upstream-20261009/lil-swole--gg0805.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/lil-swole--gg0805",
    "spritesheetSha256": "3ef92b0f66ab097c75b2e9f5bb03c299c4140e20fe0802228f2c5f3fd2bcf810",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/gg0805"
  },
  {
    "id": "little-sheep--mingdong",
    "title": "Little Sheep",
    "englishTitle": "Little Sheep",
    "description": "A fluffy cream sheep with wine-red horns, made as a cozy Codex companion that grazes, waits, and trots in tiny loops.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "MingDong",
    "authorHandle": "MingDong",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/little-sheep--mingdong.webp",
    "thumbnail": "assets/pets/upstream-20261009/little-sheep--mingdong-thumb.webp",
    "version": 1,
    "tags": [
      "sheep",
      "animal",
      "fluffy",
      "wine-red-horns",
      "cozy"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-sheep--mingdong",
    "license": "CC BY-NC 4.0. Original AI-assisted asset created by MingDong for Codex pet submission; no third-party source asset.",
    "download": "assets/pets/upstream-20261009/little-sheep--mingdong.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/little-sheep--mingdong",
    "spritesheetSha256": "af80e8c26246720152ce425c44b3e10606df56351477e916044103832a0248b3",
    "metadataNameAlias": false
  },
  {
    "id": "lulu--yogazz",
    "title": "Lulu",
    "englishTitle": "Lulu",
    "description": "A cheerful rounded yellow-orange 3D toy companion for Codex.",
    "category": "\u5409\u7965\u7269",
    "author": "YoGazz",
    "authorHandle": "YoGazz",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/lulu--yogazz.webp",
    "thumbnail": "assets/pets/upstream-20261009/lulu--yogazz-thumb.webp",
    "version": 1,
    "tags": [
      "original",
      "3d-toy",
      "yellow-orange",
      "codex-pet"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lulu--yogazz",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/lulu--yogazz.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/lulu--yogazz",
    "spritesheetSha256": "459bf8ce95e855331bdd81de48b8466a46a1df72e6fdef45a77213eda89373a3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/YoGazz"
  },
  {
    "id": "mahiro--lingxiaotian",
    "title": "\u7EEA\u5C71\u771F\u5BFB",
    "englishTitle": "Mahiro",
    "description": "A shy Codex digital pet inspired by Mahiro Oyama from ONIMAI, wearing an oversized off-shoulder summer shirt.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mahiro--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/mahiro--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "onimai",
      "mahiro",
      "oyama-mahiro",
      "off-shoulder"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mahiro--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/mahiro--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "onimai"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mahiro--lingxiaotian",
    "spritesheetSha256": "a9222f3db52ff004814e12897baee2c2b86240749526de45ec418c21125156ec",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "mai--dwdestiny",
    "title": "Mai",
    "englishTitle": "Mai",
    "description": "A cool and fluffy white bichon-style puppy boss with round sunglasses, an orange bow tie, and playful work animations.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "DwDestiny",
    "authorHandle": "DwDestiny",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mai--dwdestiny.webp",
    "thumbnail": "assets/pets/upstream-20261009/mai--dwdestiny-thumb.webp",
    "version": 1,
    "tags": [
      "dog",
      "bichon",
      "puppy",
      "sunglasses",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mai--dwdestiny",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/mai--dwdestiny.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mai--dwdestiny",
    "spritesheetSha256": "dde0f307bd046cd5f9bd72103bfcac22c4b2f892a002e6bad545aa5132ebc697",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/DwDestiny"
  },
  {
    "id": "mihari--hyoni1129",
    "title": "Mihari",
    "englishTitle": "Mihari",
    "description": "Unofficial fan-made Codex pet inspired by Mihari Oyama from ONIMAI, adapted as a tiny caring chibi pixel-art lab assistant with smoother directional motion, notebook task-processing, and clipboard review states.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "Jeonghan Lee (@Hyoni1129)",
    "authorHandle": "Hyoni1129",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mihari--hyoni1129.webp",
    "thumbnail": "assets/pets/upstream-20261009/mihari--hyoni1129-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "onimai",
      "mihari",
      "scientist",
      "lab-coat",
      "fan-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mihari--hyoni1129",
    "license": "CC BY-NC 4.0; unofficial fan-made non-commercial pet; no official ONIMAI artwork, screenshots, logos, or source assets are included; underlying character rights belong to their respective rights holders.",
    "download": "assets/pets/upstream-20261009/mihari--hyoni1129.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "onimai"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mihari--hyoni1129",
    "spritesheetSha256": "edc0709882db81345f6365eec499cdef9f67cb76876284228f367c662ff69e68",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Hyoni1129"
  },
  {
    "id": "mika--rotl24",
    "title": "Mika",
    "englishTitle": "Mika",
    "description": "A cozy long-haired chibi companion in headphones, scarf, and school-style winter clothes.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "ROTl24",
    "authorHandle": "ROTl24",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mika--rotl24.webp",
    "thumbnail": "assets/pets/upstream-20261009/mika--rotl24-thumb.webp",
    "version": 1,
    "tags": [
      "mika",
      "chibi",
      "headphones",
      "winter",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mika--rotl24",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/mika--rotl24.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mika--rotl24",
    "spritesheetSha256": "5b0f19306e0a4d12393875004bf700dd5cf35d59a1d3c14bc31cc4a8062e2f9c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ROTl24"
  },
  {
    "id": "mikoto--lingxiaotian",
    "title": "\u5FA1\u5742\u7F8E\u7434",
    "englishTitle": "Mikoto",
    "description": "A chibi electric schoolgirl Codex pet with coin tricks inspired by Misaka Mikoto.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mikoto--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/mikoto--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "a-certain-scientific-railgun",
      "electric",
      "schoolgirl",
      "misaka-mikoto"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mikoto--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/mikoto--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "a-certain-scientific-railgun"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mikoto--lingxiaotian",
    "spritesheetSha256": "1765adf93fd65916a6f1cae8670d8df0afa30231fc8214999c98ebefb0a4c5c2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "miku--lingxiaotian",
    "title": "\u521D\u97F3\u672A\u6765",
    "englishTitle": "Miku",
    "description": "A compact Codex digital pet inspired by Hatsune Miku, a bright virtual idol singer.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/miku--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/miku--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "virtual-idol",
      "teal-hair",
      "twintails",
      "miku"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/miku--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/miku--lingxiaotian",
    "spritesheetSha256": "6212ca761be1278b1dbcba214e2c8a0f637f0b526eb4e3692994f74e750e502c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "mimi--spacebody",
    "title": "Mimi",
    "englishTitle": "Mimi",
    "description": "A silver tabby American Shorthair kitten companion with bright green eyes and playful desktop-pet motions.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "Jerry",
    "authorHandle": "Spacebody",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/mimi--spacebody.webp",
    "thumbnail": "assets/pets/upstream-20261009/mimi--spacebody-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "kitten",
      "tabby",
      "cute",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mimi--spacebody",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/mimi--spacebody.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/mimi--spacebody",
    "spritesheetSha256": "f8acfb98b864a717a5876fc7a4ce696b2bced4998c62b913b4ddec30721760a0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Spacebody"
  },
  {
    "id": "minty--somnusochi",
    "title": "Minty",
    "englishTitle": "Minty",
    "description": "A mint-haired animated companion with nine activity animations and sixteen v2 look directions.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Somnusochi",
    "authorHandle": "Somnusochi",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/minty--somnusochi.webp",
    "thumbnail": "assets/pets/upstream-20261009/minty--somnusochi-thumb.webp",
    "version": 2,
    "tags": [
      "mint",
      "anime",
      "look-directions",
      "pixel-art",
      "codex-v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/minty--somnusochi",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/minty--somnusochi.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/minty--somnusochi",
    "spritesheetSha256": "f50fa768ae82a9874a9429174d0dc69f35ff0937f827a1f5805317ca3a6f4d89",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Somnusochi"
  },
  {
    "id": "misaka-network--ldl1234",
    "title": "\u5FA1\u5742\u7F51\u7EDC",
    "englishTitle": "Misaka Network",
    "description": "\u5FA1\u5742\u7F51\u7EDC\u98CE\u683C\u7684 v2 Codex \u50CF\u7D20\u5BA0\u7269\uFF0C\u7A7F\u7C73\u8272\u6821\u670D\u5916\u5957\u3001\u7EA2\u9886\u7ED3\u4E0E\u84DD\u7070\u683C\u88D9\uFF0C\u4FDD\u7559\u9ED1\u732B\u3001\u673A\u68B0\u88C5\u5907\u3001\u7535\u6D41\u548C\u5DE8\u5927\u98CE\u673A\u6548\u679C\uFF0C\u5E76\u652F\u6301 16 \u4E2A\u73AF\u89C6\u65B9\u5411\u3002",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "LyuDonglian",
    "authorHandle": "ldl1234",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/misaka-network--ldl1234.webp",
    "thumbnail": "assets/pets/upstream-20261009/misaka-network--ldl1234-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "a-certain-scientific-railgun",
      "electric",
      "schoolgirl",
      "misaka-network",
      "pixel-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/misaka-network--ldl1234",
    "license": "MIT",
    "download": "assets/pets/upstream-20261009/misaka-network--ldl1234.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "a-certain-scientific-railgun"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/misaka-network--ldl1234",
    "spritesheetSha256": "18f63c26660ab453cf0f575c9c8c3a82b125121adb53821602bb1884ab4ef44b",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ldl1234"
  },
  {
    "id": "missile--zpzjzj",
    "title": "Missile",
    "englishTitle": "Missile",
    "description": "An energetic orange Pomeranian inspired by Ghost Trick's loyal Missile, with a huge cream ruff, curled plume tail, and joyful expression.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "Ping",
    "authorHandle": "zpzjzj",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/missile--zpzjzj.webp",
    "thumbnail": "assets/pets/upstream-20261009/missile--zpzjzj-thumb.webp",
    "version": 2,
    "tags": [
      "ghost-trick",
      "missile",
      "dog",
      "pomeranian",
      "flat-vector"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/missile--zpzjzj",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/missile--zpzjzj.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/missile--zpzjzj",
    "spritesheetSha256": "007969983fc73bb30e601713e61bc25bf78f3590b5ae432f755d39d3efc619cb",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zpzjzj"
  },
  {
    "id": "my-little-orange-cat--zhou-jianwen",
    "title": "My Little Orange Cat",
    "englishTitle": "My Little Orange Cat",
    "description": "A softly illustrated orange-and-white cat inspired by community request #179.",
    "category": "\u5176\u4ED6",
    "author": "zhou-jianwen",
    "authorHandle": "zhou-jianwen",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.webp",
    "thumbnail": "assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen-thumb.webp",
    "version": 2,
    "tags": [
      "cat",
      "community-request"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/my-little-orange-cat--zhou-jianwen",
    "license": "Non-commercial use and redistribution only, with credit to zhou-jianwen for this AI-assisted pet contribution. Commercial use is prohibited. No ownership or license over the submitted reference photograph is asserted or granted.",
    "download": "assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/my-little-orange-cat--zhou-jianwen",
    "spritesheetSha256": "90f70801768beef9a0d9d66a28371c0e9e7635b40eed27d96fd6427c56975ec4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zhou-jianwen"
  },
  {
    "id": "nahida--lingxiaotian",
    "title": "\u7EB3\u897F\u59B2",
    "englishTitle": "Nahida",
    "description": "\u300A\u539F\u795E\u300B\u7EB3\u897F\u59B2\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u767D\u7EFF\u914D\u8272\u3001\u53F6\u9970\u8F6E\u5ED3\u4E0E\u8F7B\u76C8\u6E29\u67D4\u7684\u68EE\u6797\u7CBE\u7075\u6C14\u8D28\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/nahida--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/nahida--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "nahida",
      "dendro",
      "green"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nahida--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/nahida--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/nahida--lingxiaotian",
    "spritesheetSha256": "ee20f2d7996c296be86895af0413e02adfaf81705ff6373927cab39d394b8ebb",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "navia--lingxiaotian",
    "title": "\u5A1C\u7EF4\u5A05",
    "englishTitle": "Navia",
    "description": "\u300A\u539F\u795E\u300B\u5A1C\u7EF4\u5A05\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9EC4\u9ED1\u793C\u670D\u3001\u5BBD\u6A90\u5E3D\u4E0E\u660E\u4EAE\u5927\u5C0F\u59D0\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/navia--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/navia--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "navia",
      "gold",
      "elegant"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/navia--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/navia--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/navia--lingxiaotian",
    "spritesheetSha256": "daf0ad82f6ebd07e32e6a6833e6a7eb2465520cf05080959d66d8db624955052",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "night-neko--netizenxuan",
    "title": "Night Neko",
    "englishTitle": "Night Neko",
    "description": "A white cat-demon desktop companion with sleepy eyes, red-black bat wings, gothic stripes, one fluffy tail, and late-night coding energy.",
    "category": "\u5E7B\u60F3\u751F\u7269",
    "author": "netizenXuan",
    "authorHandle": "netizenXuan",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/night-neko--netizenxuan.webp",
    "thumbnail": "assets/pets/upstream-20261009/night-neko--netizenxuan-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "demon",
      "gothic",
      "night",
      "coding",
      "cyberpunk",
      "chibi"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/night-neko--netizenxuan",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/night-neko--netizenxuan.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/night-neko--netizenxuan",
    "spritesheetSha256": "0762cd9a14129b765a030fe5a35785faa2d6e466fb080a7607e42a6bd765c4a2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/netizenXuan"
  },
  {
    "id": "niu-lai--wynn",
    "title": "Niu Lai",
    "englishTitle": "Niu Lai",
    "description": "An unofficial, AI-generated Niu Lai fan-art calf companion, patient during approvals and curious during research.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "wynn",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/niu-lai--wynn.webp",
    "thumbnail": "assets/pets/upstream-20261009/niu-lai--wynn-thumb.webp",
    "version": 2,
    "tags": [
      "fan-art",
      "3d",
      "ai-generated",
      "orange",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niu-lai--wynn",
    "license": "Non-commercial use and redistribution only, with credit to wynn, to the extent wynn holds rights in this contribution. The underlying Niu Lai film character and reference imagery remain subject to third-party rights; no permission from their rightsholders is asserted or granted. Unofficial fan art; no affiliation or endorsement. These terms do not establish third-party rights clearance.",
    "download": "assets/pets/upstream-20261009/niu-lai--wynn.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/niu-lai--wynn",
    "spritesheetSha256": "75b1809e88d6e4bebcb040f9a3dcffdb1eed1964dd86366527bb95ea7d26b575",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/zhou-jianwen"
  },
  {
    "id": "paimon--lingxiaotian",
    "title": "\u6D3E\u8499",
    "englishTitle": "Paimon",
    "description": "A compact Codex digital pet inspired by Paimon, the floating companion from Genshin Impact.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/paimon--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/paimon--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "paimon",
      "floating-companion",
      "white-hair"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/paimon--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/paimon--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/paimon--lingxiaotian",
    "spritesheetSha256": "489946a931de1f561c50d2e6941c82707d5703b6073b5169b6bc5c607459aea6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "panda--jason-bai",
    "title": "Panda",
    "englishTitle": "Panda",
    "description": "A soft, healing panda companion with round eyes, tiny paws, and gentle calming poses.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "Jason Bai",
    "authorHandle": "Jason-Bai",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/panda--jason-bai.webp",
    "thumbnail": "assets/pets/upstream-20261009/panda--jason-bai-thumb.webp",
    "version": 1,
    "tags": [
      "panda",
      "soft",
      "healing",
      "cute",
      "gentle",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/panda--jason-bai",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/panda--jason-bai.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/panda--jason-bai",
    "spritesheetSha256": "a7c9d21f98af24566daa8fbbd67b65e6b48572eec885165d7b86c5a4311fb325",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jason-Bai"
  },
  {
    "id": "pixel-duck--flamurmaliqi",
    "title": "Pixel Duck",
    "englishTitle": "Pixel Duck",
    "description": "An original pixel duck that spins through the same eight-frame loop in every Codex state.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "Flamur Maliqi",
    "authorHandle": "FlamurMaliqi",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.webp",
    "thumbnail": "assets/pets/upstream-20261009/pixel-duck--flamurmaliqi-thumb.webp",
    "version": 1,
    "tags": [
      "duck",
      "pixel-art",
      "spin",
      "codex-pets"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/pixel-duck--flamurmaliqi",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/pixel-duck--flamurmaliqi",
    "spritesheetSha256": "88ca26717528fe1d01fcba2a649cc5633e40ea886e3b028ffab25654787a87da",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/FlamurMaliqi"
  },
  {
    "id": "potato--legeling",
    "title": "Potato",
    "englishTitle": "Potato",
    "description": "A plain ochre pixel potato with a stepped outline and gentle organic movements.",
    "category": "\u7269\u4EF6\u4E0E\u9053\u5177",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/potato--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/potato--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/potato--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/potato--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/potato--legeling",
    "spritesheetSha256": "48531925a56a4808f822cccfe6b6e91ec0a4bdc0c70f5270d935e98f273c5d98",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "raiden-shogun--lingxiaotian",
    "title": "\u96F7\u7535\u5C06\u519B",
    "englishTitle": "Raiden Shogun",
    "description": "\u300A\u539F\u795E\u300B\u96F7\u7535\u5C06\u519B\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u8272\u957F\u53D1\u3001\u7535\u5143\u7D20\u7D2B\u5149\u70B9\u7F00\u3001\u548C\u98CE\u670D\u9970\u8F6E\u5ED3\u4E0E\u5A01\u4E25\u51B7\u9759\u7684\u795E\u660E\u6C14\u8D28\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/raiden-shogun--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "genshin-impact",
      "raiden-shogun",
      "electro",
      "purple"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/raiden-shogun--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/raiden-shogun--lingxiaotian",
    "spritesheetSha256": "5eed45f5082a086facf960007b8cc1fab00abe01c1ebc2fdd1a6dd2e418e8ca4",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "reimu--lingxiaotian",
    "title": "\u535A\u4E3D\u7075\u68A6",
    "englishTitle": "Reimu",
    "description": "A compact Codex digital pet inspired by Hakurei Reimu, a calm shrine maiden from Touhou.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/reimu--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/reimu--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "touhou",
      "touhou-project",
      "shrine-maiden",
      "reimu",
      "hakurei-reimu"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/reimu--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/reimu--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "touhou-project"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/reimu--lingxiaotian",
    "spritesheetSha256": "b438b769665feb0c2c5c6f87d489af4d7eb3515e89c6ef19222587d4e9cf1677",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "rinami--siiverash",
    "title": "Rinami Himesaki",
    "englishTitle": "Rinami Himesaki",
    "description": "A Rinami Himesaki-inspired fan-art Codex pet with long wavy light-brown hair, crown-braid styling, a navy-and-gold school-uniform palette, and a compact chibi pixel sprite identity.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "SiIverAsh",
    "authorHandle": "SiIverAsh",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/rinami--siiverash.webp",
    "thumbnail": "assets/pets/upstream-20261009/rinami--siiverash-thumb.webp",
    "version": 1,
    "tags": [
      "gakuen-idolmaster",
      "rinami-himesaki",
      "pixel-art",
      "hatch-pet"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/rinami--siiverash",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/rinami--siiverash.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "gakuen-idolmaster"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/rinami--siiverash",
    "spritesheetSha256": "1547fb38ec66c26f0426984e0efe5c051febf11d78250695e4defa13c9fa1f75",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/SiIverAsh"
  },
  {
    "id": "robin--lingxiaotian",
    "title": "\u77E5\u66F4\u9E1F",
    "englishTitle": "Robin",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u77E5\u66F4\u9E1F\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u6D45\u84DD\u767D\u793C\u670D\u3001\u5206\u53C9\u91D1\u8272\u5149\u73AF\u4E0E\u6B4C\u59EC\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/robin--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/robin--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "robin",
      "angelic",
      "blue"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/robin--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/robin--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/robin--lingxiaotian",
    "spritesheetSha256": "2a34d75d2aab0385b12d9b920c9aa30e6804dd74505eebc08308715459a6ca8b",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "ruan-mei--lingxiaotian",
    "title": "\u962E\xB7\u6885",
    "englishTitle": "Ruan Mei",
    "description": "\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u962E\u6885\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9752\u7EFF\u6E10\u53D8\u3001\u6885\u82B1/\u7434\u5F26\u611F\u3001\u51B7\u9759\u8868\u60C5\u3002.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/ruan-mei--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/ruan-mei--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "ruan-mei",
      "teal",
      "elegant"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruan-mei--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/ruan-mei--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/ruan-mei--lingxiaotian",
    "spritesheetSha256": "829c613e78e4c9b3b0e727984f1077ca88c98e17c16a219837ebdd258ed7ad05",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "ruruka--ltmcliao-cmyk",
    "title": "RuRuKa",
    "englishTitle": "RuRuKa",
    "description": "RuRuKa is a 3D-style black-and-cream glasses companion with expressive Codex workflow animations.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "ltmcliao-cmyk",
    "authorHandle": "ltmcliao-cmyk",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.webp",
    "thumbnail": "assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk-thumb.webp",
    "version": 1,
    "tags": [
      "ruruka",
      "3d",
      "glasses",
      "animated",
      "codex",
      "workflow"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruruka--ltmcliao-cmyk",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/ruruka--ltmcliao-cmyk",
    "spritesheetSha256": "9bec1eb0abf2ba4c28d397782f64b08ff7cb6aeb4b533338e7989cec6215c55c",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/ltmcliao-cmyk"
  },
  {
    "id": "saki--rookie-09",
    "title": "Saki",
    "englishTitle": "Saki",
    "description": "A tiny cyan pixel-style Saki mascot with wings, cat ears, and cheerful desktop-pet animations.",
    "category": "\u5409\u7965\u7269",
    "author": "rookie-09",
    "authorHandle": "rookie-09",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/saki--rookie-09.webp",
    "thumbnail": "assets/pets/upstream-20261009/saki--rookie-09-thumb.webp",
    "version": 1,
    "tags": [
      "saki",
      "cyan",
      "pixel-art",
      "mascot",
      "wings",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/saki--rookie-09",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/saki--rookie-09.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/saki--rookie-09",
    "spritesheetSha256": "61ea42dffd8aaaaa3136450085d122efcdf860fa495a17105ba1559ee17a2148",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/rookie-09"
  },
  {
    "id": "serge-le-lapin--legeling",
    "title": "Serge le Lapin",
    "englishTitle": "Serge le Lapin",
    "description": "\u4E00\u53EA\u7C89\u8272\u957F\u8033\u3001\u767D\u8272\u53E3\u9F3B\u3001\u9EC4\u4E0A\u8863\u548C\u84DD\u88E4\u5B50\u7684\u6D3B\u6CFC Q \u7248\u5154\u5B50\u4F19\u4F34\u3002",
    "category": "\u5409\u7965\u7269",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/serge-le-lapin--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/serge-le-lapin--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "serge-le-lapin",
      "community-request",
      "ai-generated",
      "mascot",
      "rabbit",
      "sticker",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/serge-le-lapin--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u76F8\u5173\u89D2\u8272\u6216\u5546\u6807\u6743\u5229\u65B9\u6388\u6743\u3002",
    "download": "assets/pets/upstream-20261009/serge-le-lapin--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/serge-le-lapin--legeling",
    "spritesheetSha256": "4087884d17cd353dffe0b73966e26ce144071a907f46935644fe2579b7a74293",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "shian-helper--mistyshen",
    "title": "Shian",
    "englishTitle": "Shian",
    "description": "A soft blonde chibi coding companion with black-and-orange bows and a gentle expression.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "mistyShen",
    "authorHandle": "mistyShen",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/shian-helper--mistyshen.webp",
    "thumbnail": "assets/pets/upstream-20261009/shian-helper--mistyshen-thumb.webp",
    "version": 1,
    "tags": [
      "shian",
      "blonde",
      "chibi",
      "bows",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shian-helper--mistyshen",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/shian-helper--mistyshen.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/shian-helper--mistyshen",
    "spritesheetSha256": "4ddbd7d55353ce292e34afbd570efceeb4cb476c397034ddec98319b99c82d8d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/mistyShen"
  },
  {
    "id": "silver-wolf--lingxiaotian",
    "title": "\u94F6\u72FC",
    "englishTitle": "Silver Wolf",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u94F6\u72FC\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u7070\u77ED\u53D1\u3001\u9ED1\u5BA2\u611F\u62A4\u76EE\u955C\u4E0E\u9ED1\u7D2B\u673A\u80FD\u7A7F\u642D\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/silver-wolf--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/silver-wolf--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "silver-wolf",
      "hacker",
      "cyber"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/silver-wolf--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/silver-wolf--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/silver-wolf--lingxiaotian",
    "spritesheetSha256": "6bae5695b739d8503ef5895ba4282e46dcee78dbacf891b50b40d7ef3f237289",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "sparkle--lingxiaotian",
    "title": "\u82B1\u706B",
    "englishTitle": "Sparkle",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u82B1\u706B\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7EA2\u9ED1\u914D\u8272\u3001\u53CC\u9A6C\u5C3E\u3001\u9762\u5177\u548C\u4FCF\u76AE\u620F\u5267\u611F\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/sparkle--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/sparkle--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "sparkle",
      "mask",
      "twin-tails"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sparkle--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/sparkle--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/sparkle--lingxiaotian",
    "spritesheetSha256": "8b55199ed720169f8f50d2eec6c846741f16c706e6bfc181192d1970a51ba4e2",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "st-tibo-reset--wynn",
    "title": "St. Tibo Reset",
    "englishTitle": "St. Tibo Reset",
    "description": "A serene, cross-legged Tibo in green and gold robes, ready to press his big red RESET button and give your work a fresh start.",
    "category": "\u7F51\u7EDC\u6897\u56FE",
    "author": "wynn",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/st-tibo-reset--wynn.webp",
    "thumbnail": "assets/pets/upstream-20261009/st-tibo-reset--wynn-thumb.webp",
    "version": 2,
    "tags": [
      "meme",
      "human",
      "3d",
      "green"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/st-tibo-reset--wynn",
    "license": "Non-commercial use and redistribution only, with credit to wynn, to the extent the contributor holds rights in this work. Reference imagery and the depicted person's rights remain with their respective rightsholders and are not licensed by this submission. Unofficial fan art; no affiliation or endorsement is claimed. These terms do not establish third-party rights clearance. Please contact the contributor or maintainers with rights concerns so the submission can be reviewed, revised, or removed.",
    "download": "assets/pets/upstream-20261009/st-tibo-reset--wynn.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/st-tibo-reset--wynn",
    "spritesheetSha256": "812f83e1ca0f93de2cfffa9c29525cfe6f8667d001e8cd106e2164f9de7ce25c",
    "metadataNameAlias": false
  },
  {
    "id": "starcorn--alterhq",
    "title": "Starcorn",
    "englishTitle": "Starcorn",
    "description": "A white chibi unicorn with a multicolor horn and a yellow star marking.",
    "category": "\u5E7B\u60F3\u751F\u7269",
    "author": "Alter",
    "authorHandle": "alterhq",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/starcorn--alterhq.webp",
    "thumbnail": "assets/pets/upstream-20261009/starcorn--alterhq-thumb.webp",
    "version": 1,
    "tags": [
      "unicorn",
      "fantasy",
      "creature",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/starcorn--alterhq",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/starcorn--alterhq.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/starcorn--alterhq",
    "spritesheetSha256": "d2d91b5339bc46662feddbab643e4fb92278de18281859fb37fcf77cc2a65d66",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/alterhq"
  },
  {
    "id": "sunny-retriever--legeling",
    "title": "\u6696\u9633\u91D1\u6BDB",
    "englishTitle": "Sunny Retriever",
    "description": "A cheerful honey-gold retriever puppy with a teal collar, expressive task animations, and 16 look directions.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/sunny-retriever--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/sunny-retriever--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "golden-retriever",
      "dog",
      "puppy",
      "teal-collar",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sunny-retriever--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/sunny-retriever--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/sunny-retriever--legeling",
    "spritesheetSha256": "447a79a275ba01fcef5805c5e4ec3dccce7d8836e0492af28fb81a5ce7898ee0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "tangdouren--carl312",
    "title": "Tangdouren",
    "englishTitle": "Tangdouren",
    "description": "A chibi big-headed girl pet with side-parted brown bob hair and glossy eyes.",
    "category": "\u4EBA\u7269\u5934\u50CF",
    "author": "Carl-312",
    "authorHandle": "Carl-312",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tangdouren--carl312.webp",
    "thumbnail": "assets/pets/upstream-20261009/tangdouren--carl312-thumb.webp",
    "version": 1,
    "tags": [
      "chibi",
      "person",
      "brown-hair",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tangdouren--carl312",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/tangdouren--carl312.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tangdouren--carl312",
    "spritesheetSha256": "216b994b833f54fef6f719c6c42e116e666fa7d7d2b40f31f5d2acb872a8411a",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Carl-312"
  },
  {
    "id": "tian-hua-hua--d1a0y1bb",
    "title": "Tian Hua Hua",
    "englishTitle": "Tian Hua Hua",
    "description": "A round calico cat companion with sleepy eyes and a calm, slightly serious expression.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "D1a0y1bb",
    "authorHandle": "D1a0y1bb",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.webp",
    "thumbnail": "assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "calico",
      "round",
      "sleepy",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tian-hua-hua--d1a0y1bb",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tian-hua-hua--d1a0y1bb",
    "spritesheetSha256": "5aaa783e17577b92ebdfd2070c95916245be0c378ac6931ef7fa98bb99cb6dc6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/D1a0y1bb"
  },
  {
    "id": "tingyun--lingxiaotian",
    "title": "\u505C\u4E91",
    "englishTitle": "Tingyun",
    "description": "\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u505C\u4E91\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u72D0\u8033\u4E0E\u5927\u5C3E\u5DF4\u3001\u91D1\u68D5\u7EA2\u914D\u8272\u3001\u7EFF\u773C\u548C\u6E29\u67D4\u4F18\u96C5\u7684\u795E\u6001\u90FD\u88AB\u538B\u7F29\u8FDB\u5C0F\u4F53\u91CF\u52A8\u753B\u91CC\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tingyun--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/tingyun--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "honkai-star-rail",
      "tingyun",
      "fox-ears",
      "gold-brown"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tingyun--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/tingyun--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "honkai-star-rail"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tingyun--lingxiaotian",
    "spritesheetSha256": "18c19bc5f493c11f37b83f0d2a2bb861525ab1adf3b05eaba407c1fd9210796a",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "wally--wally025",
    "title": "Wally",
    "englishTitle": "Wally",
    "description": "A cheerful little white guide mascot for builds, reviews, and clean progress.",
    "category": "\u5409\u7965\u7269",
    "author": "Wally Pet Contributors",
    "authorHandle": "wally025",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/wally--wally025.webp",
    "thumbnail": "assets/pets/upstream-20261009/wally--wally025-thumb.webp",
    "version": 1,
    "tags": [
      "wally",
      "mascot",
      "white",
      "guide",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/wally--wally025",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/wally--wally025.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/wally--wally025",
    "spritesheetSha256": "f9b7d6dd1f9ab97f94d83b78b05f1246fc7c73b9c3c4678fd4ae314a41e25483",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/wally025"
  },
  {
    "id": "warden-codex--jorge-cuevas90003",
    "title": "Warden Codex",
    "englishTitle": "Warden Codex",
    "description": "An original chibi armored guardian in olive-green sci-fi power armor with a gold visor, always carrying his rifle.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Jorge Cuevas",
    "authorHandle": "Jorge-Cuevas90003",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.webp",
    "thumbnail": "assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003-thumb.webp",
    "version": 2,
    "tags": [
      "sci-fi",
      "armored",
      "guardian",
      "chibi",
      "original",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/warden-codex--jorge-cuevas90003",
    "license": "CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge Cuevas; no third-party source assets were used.",
    "download": "assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/warden-codex--jorge-cuevas90003",
    "spritesheetSha256": "7c51b5594653a8934002c8329b50a1b414764261b778aa5541ece7cc89db7285",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Jorge-Cuevas90003"
  },
  {
    "id": "xian-xiao-lu--qingyunagi",
    "title": "Xian Xiao Lu",
    "englishTitle": "Xian Xiao Lu",
    "description": "A peaceful little xianxia deer sitting on a cloud with a gourd and fly-whisk.",
    "category": "\u5E7B\u60F3\u751F\u7269",
    "author": "qingyunAGI",
    "authorHandle": "qingyunAGI",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.webp",
    "thumbnail": "assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi-thumb.webp",
    "version": 1,
    "tags": [
      "deer",
      "xianxia",
      "cloud",
      "peaceful",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xian-xiao-lu--qingyunagi",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xian-xiao-lu--qingyunagi",
    "spritesheetSha256": "17bc75e7d3a9c026ce8210572327b89fade9bba490f7b079d6bd3b96805354e1",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/qingyunAGI"
  },
  {
    "id": "yier--gbn666",
    "title": "Yi Er",
    "englishTitle": "Yi Er",
    "description": "A soft, gentle white chibi desktop pet with dark round ears, pink cheeks, and a shy expression.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Guo Beining",
    "authorHandle": "gbn666",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yier--gbn666.webp",
    "thumbnail": "assets/pets/upstream-20261009/yier--gbn666-thumb.webp",
    "version": 1,
    "tags": [
      "chibi",
      "pixel-art",
      "soft",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yier--gbn666",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/yier--gbn666.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yier--gbn666",
    "spritesheetSha256": "5b0a84b5094172d965f82f7ba5962b35fad898274878cb492a3efe98b4c70b15",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/gbn666"
  },
  {
    "id": "yuanzai--gaming33",
    "title": "Yuanzai",
    "englishTitle": "Yuanzai",
    "description": "A cute cat-headed bee companion with tiny wings, striped colors, and a gentle round face.",
    "category": "\u5E7B\u60F3\u751F\u7269",
    "author": "Gaming33",
    "authorHandle": "Gaming33",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yuanzai--gaming33.webp",
    "thumbnail": "assets/pets/upstream-20261009/yuanzai--gaming33-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "bee",
      "striped",
      "cute",
      "round",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanzai--gaming33",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/yuanzai--gaming33.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yuanzai--gaming33",
    "spritesheetSha256": "15f11b04440047f6a994e582bd2223454aacf3da86c197069bbfbe8d37101b7d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Gaming33"
  },
  {
    "id": "yuzubou--keseras34938976",
    "title": "Yuzubou",
    "englishTitle": "Yuzubou",
    "description": "A cheerful little yuzu monk in a straw hat, leaf cap, robes, and prayer beads.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Keseras34938976",
    "authorHandle": "Keseras34938976",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yuzubou--keseras34938976.webp",
    "thumbnail": "assets/pets/upstream-20261009/yuzubou--keseras34938976-thumb.webp",
    "version": 1,
    "tags": [
      "yuzu",
      "monk",
      "straw-hat",
      "leaf",
      "cute",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuzubou--keseras34938976",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/yuzubou--keseras34938976.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yuzubou--keseras34938976",
    "spritesheetSha256": "8e1bd8a6e5b0d5a644933bb8cc40615a8877e573d49fe436492d4c586c576fad",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Keseras34938976"
  },
  {
    "id": "uesugi-erii--ricardo-2005",
    "title": "\u4E0A\u6749\u7ED8\u68A8\u8863codex\u5BA0\u7269",
    "englishTitle": "\u4E0A\u6749\u7ED8\u68A8\u8863codex\u5BA0\u7269",
    "description": "\u4E0A\u6749\u7ED8\u68A8\u8863\u7684\u975E\u5B98\u65B9 AI \u540C\u4EBA Codex \u684C\u9762\u5BA0\u7269\u3002",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "Ricardo-2005",
    "authorHandle": "Ricardo-2005",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.webp",
    "thumbnail": "assets/pets/upstream-20261009/uesugi-erii--ricardo-2005-thumb.webp",
    "version": 2,
    "tags": [
      "dragon-raja",
      "uesugi-erii",
      "anime",
      "fan-art",
      "red-hair",
      "pixel-art",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/uesugi-erii--ricardo-2005",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u4F5C\u54C1\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",
    "download": "assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/uesugi-erii--ricardo-2005",
    "spritesheetSha256": "584ad142250b0bf601faa876618e38468de77dd5d7cc4e149e3cad1544f4b253",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Ricardo-2005"
  },
  {
    "id": "yuanbao--legeling",
    "title": "\u5143\u5B9D",
    "englishTitle": "\u5143\u5B9D",
    "description": "\u4E00\u53EA\u7070\u767D\u76F8\u95F4\u3001\u5E26\u82CF\u683C\u5170\u6298\u8033\u7279\u5F81\u548C\u5927\u5706\u773C\u7684\u534A\u5199\u5B9E\u864E\u6591\u732B\u684C\u9762\u4F19\u4F34\u3002",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yuanbao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/yuanbao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "cat",
      "scottish-fold",
      "tabby",
      "gray-white",
      "community-request",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanbao--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/yuanbao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yuanbao--legeling",
    "spritesheetSha256": "dd37bd8664636ea6639ad4bf5e1ea50e82a5864b72520f88fb5fabc80222fa50",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "yae-miko--legeling",
    "title": "\u516B\u91CD\u795E\u5B50",
    "englishTitle": "Yae Miko",
    "description": "\u300A\u539F\u795E\u300B\u516B\u91CD\u795E\u5B50\u7075\u611F\u7684\u539F\u521B\u975E\u5546\u4E1A Codex v2 chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7C89\u8272\u957F\u53D1\u3001\u72D0\u8033\u3001\u7EA2\u767D\u5DEB\u5973\u670D\u4E0E\u7D2B\u91D1\u914D\u9970\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u5F62\u8C61\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/yae-miko--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/yae-miko--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "genshin-impact",
      "yae-miko",
      "kitsune",
      "shrine-maiden",
      "pink-hair",
      "pixel-art",
      "chibi",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yae-miko--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/yae-miko--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "genshin-impact"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/yae-miko--legeling",
    "spritesheetSha256": "5b211fae44ff5bd4541dcce1c01d378af30ed3c670b205b67d5a3c4c3323b884",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "liuboer--legeling",
    "title": "\u5218\u6CE2\u513F",
    "englishTitle": "\u5218\u6CE2\u513F",
    "description": "A slim black Devon Rex with enormous triangular ears, yellow-green eyes and a short rippled coat.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/liuboer--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/liuboer--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liuboer--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/liuboer--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/liuboer--legeling",
    "spritesheetSha256": "ac28440619bc4f318a386608ca6753a5a331b1d6f5cc8e36095f8b07c9f71614",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "miku-sea--legeling",
    "title": "\u521D\u97F3\u672A\u6765\xB7\u6D77\u8272",
    "englishTitle": "Hatsune Miku \xB7 Sea Colors",
    "description": "\u5FE0\u5B9E\u4E8E\u8BF7\u6C42\u8005\u516D\u5E27\u6D77\u8272\u521D\u7A3F\u7684\u521D\u97F3\u672A\u6765\u590F\u88C5\u540C\u4EBA\u5BA0\u7269\uFF1A\u8349\u5E3D\u3001\u753B\u9762\u53F3\u4FA7\u767D\u8774\u8776\u7ED3\u3001\u767D\u84DD\u88D9\u88C5\u3001\u9752\u8272\u53CC\u9A6C\u5C3E\u548C\u8D64\u811A\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/miku-sea--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/miku-sea--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "hatsune-miku",
      "summer"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku-sea--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/miku-sea--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/miku-sea--legeling",
    "spritesheetSha256": "2805e8f175d75231a0ea07a7fb9d4dc00203127b2dfa071810fc2f7aa7e68d77",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "gudong--rank",
    "title": "\u5495\u549A",
    "englishTitle": "\u5495\u549A",
    "description": "A crown-wearing rabbit king with a leafy forelock, burgundy cape, and playful oversized eyes.",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Rank",
    "authorHandle": "Rank",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/gudong--rank.webp",
    "thumbnail": "assets/pets/upstream-20261009/gudong--rank-thumb.webp",
    "version": 2,
    "tags": [
      "original-character",
      "rabbit",
      "king",
      "crown",
      "cape",
      "cartoon",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gudong--rank",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/gudong--rank.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/gudong--rank",
    "spritesheetSha256": "9a2cf19c6b2a24ac5e5950576d65ae957890938a416b5e177f0f93e48555c0f3",
    "metadataNameAlias": false
  },
  {
    "id": "tuantuan--jbbom",
    "title": "\u56E2\u56E2",
    "englishTitle": "\u56E2\u56E2",
    "description": "A soft, friendly orange-and-white shorthair kitten for Codex.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "JbBom",
    "authorHandle": "JbBom",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/tuantuan--jbbom.webp",
    "thumbnail": "assets/pets/upstream-20261009/tuantuan--jbbom-thumb.webp",
    "version": 1,
    "tags": [
      "cat",
      "kitten",
      "orange-white",
      "pixel-art",
      "codex"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tuantuan--jbbom",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/tuantuan--jbbom.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/tuantuan--jbbom",
    "spritesheetSha256": "1b3b74e0688ad5db0b1e242eee4aa6facc746456f66cfe810877813b3ef65b62",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/JbBom"
  },
  {
    "id": "virtuosa--legeling",
    "title": "\u5851\u5FC3\u963F\u5C14\u56FE\u7F57",
    "englishTitle": "Virtuosa / Arturia",
    "description": "\u6309\u793E\u533A\u53C2\u8003\u5236\u4F5C\u7684\u300A\u660E\u65E5\u65B9\u821F\u300B\u5851\u5FC3\u963F\u5C14\u56FE\u7F57\u540C\u4EBA\u5BA0\u7269\uFF0C\u4FDD\u7559\u9ED1\u53D1\u3001\u91D1\u773C\u3001\u9ED1\u91D1\u788E\u7247\u5149\u73AF\u548C\u7FFC\u72B6\u6784\u9020\u3002AI \u751F\u6210\uFF0C\u811A\u9774\u8865\u5168\u5DF2\u83B7\u5236\u4F5C\u5BA1\u6838\u8BA4\u53EF\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/virtuosa--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/virtuosa--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "arknights",
      "virtuosa"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/virtuosa--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/virtuosa--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/virtuosa--legeling",
    "spritesheetSha256": "522496bafedb3c0fd368d82f1f8e933680c6c645799a40cc9790e03ad5024f90",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "dashu--legeling",
    "title": "\u5927\u9F20",
    "englishTitle": "\u5927\u9F20",
    "description": "Da Shu from \u5927\u9F20\u4E0E\u7F8E\u53FD, with a broad gray face, pink ears, a cheerful toothy smile and a tiny body.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/dashu--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/dashu--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dashu--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/dashu--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/dashu--legeling",
    "spritesheetSha256": "b922ad1ea917101bf5e39cd9c35dedd134d44164a12496736dbffa3332e10b84",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "dnf-female-ammo--qunboo",
    "title": "dnf-female-ammo",
    "englishTitle": "\u5973\u5F39\u836FQ",
    "description": "A chibi-style Dungeon Fighter Online Female Mechanic (Ammo) desktop pet, featuring idle breathing and gun-twirl animations.",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "QunBoo",
    "authorHandle": "QunBoo",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/dnf-female-ammo--qunboo.webp",
    "thumbnail": "assets/pets/upstream-20261009/dnf-female-ammo--qunboo-thumb.webp",
    "version": 1,
    "tags": [
      "dnf",
      "dungeon-fighter",
      "dungeon-fighter-online",
      "female-ammo",
      "game",
      "chibi"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dnf-female-ammo--qunboo",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/dnf-female-ammo--qunboo.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "dungeon-fighter-online"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/dnf-female-ammo--qunboo",
    "spritesheetSha256": "6c86347073986e57148f7b81980866c7ac2c68c1112b93a85519a142b208f59d",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/QunBoo"
  },
  {
    "id": "naiwa--sandytruant",
    "title": "\u5976\u86D9",
    "englishTitle": "\u5976\u86D9",
    "description": "A yellow pear-shaped pixel companion that laughs when hovered.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "Yitian Sun",
    "authorHandle": "sandytruant",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/naiwa--sandytruant.webp",
    "thumbnail": "assets/pets/upstream-20261009/naiwa--sandytruant-thumb.webp",
    "version": 2,
    "tags": [
      "frog",
      "yellow",
      "pixel-art",
      "look-directions",
      "codex-v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/naiwa--sandytruant",
    "license": "MIT License",
    "download": "assets/pets/upstream-20261009/naiwa--sandytruant.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/naiwa--sandytruant",
    "spritesheetSha256": "5db71125ea2d30beb8507d7aae1e38521efa6db4f7cde6b1ced1a8b3a8d6439f",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/sandytruant"
  },
  {
    "id": "vyron--legeling",
    "title": "\u5A01\u9F99",
    "englishTitle": "Vyron",
    "description": "An AI-generated, weapon-free community interpretation of Vyron from Delta Force, based on the Issue #234 reference. The specific game skin is unverified.",
    "category": "\u5176\u4ED6",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/vyron--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/vyron--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "ai-generated",
      "fan-art",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/vyron--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/vyron--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/vyron--legeling",
    "spritesheetSha256": "47d2430a4b59e3bac88ee9bb2a5912a14c8be077e7908db0244c34583683b8a7",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "xiaoda--legeling",
    "title": "\u5C0F\u8FBE",
    "englishTitle": "\u5C0F\u8FBE",
    "description": "\u4E00\u53EA\u84DD\u767D\u914D\u8272\u3001\u5927\u773C\u3001\u53CC\u5929\u7EBF\u548C\u989D\u5934\u5C4F\u5E55\u7684\u8F6F\u8D28 3D Q \u7248\u673A\u5668\u4EBA\u4F19\u4F34\u3002",
    "category": "\u673A\u5668\u4EBA",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xiaoda--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/xiaoda--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "xiaoda",
      "community-request",
      "ai-generated",
      "robot",
      "mascot",
      "3d-toy",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiaoda--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u7D20\u6750\u76F8\u5173\u6743\u5229\u65B9\u6388\u6743\u3002",
    "download": "assets/pets/upstream-20261009/xiaoda--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xiaoda--legeling",
    "spritesheetSha256": "0e53ff190a3a51b22e956728a708f98575b1b9e5a871b463e08511162a89df26",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "little-black-cat--legeling",
    "title": "\u5C0F\u9ED1\u732B",
    "englishTitle": "\u5C0F\u9ED1\u732B",
    "description": "A fuzzy brush-painted black cat with slanted golden eyes, a blue nose and an inquisitive gaze.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/little-black-cat--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/little-black-cat--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-black-cat--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/little-black-cat--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/little-black-cat--legeling",
    "spritesheetSha256": "71cc9fa9b9f8d581370963e457e924af5e40e02a889b5ea191ba2566fa1d1309",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "iuno--legeling",
    "title": "\u5C24\u8BFA",
    "englishTitle": "Iuno",
    "description": "\u5BF9\u5E94\u793E\u533A\u8BF7\u6C42 #176 \u4E0E #177 \u7684\u300A\u9E23\u6F6E\u300B\u5C24\u8BFA\u540C\u4EBA\u5BA0\u7269\uFF0C\u84DD\u8272\u53CC\u9A6C\u5C3E\u3001\u767D\u91D1\u670D\u88C5\u548C\u624B\u6301\u84DD\u91D1\u5706\u73AF\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/iuno--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/iuno--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "wuthering-waves",
      "iuno"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iuno--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/iuno--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/iuno--legeling",
    "spritesheetSha256": "1ca0398437916007ee8f28b4b913e7bdea39eb1d5ac90a2fa5fe659682fac468",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "bubu-codebrew-bear--xxhh0822",
    "title": "\u5E03\u5E03",
    "englishTitle": "\u5E03\u5E03",
    "description": "A focused cocoa-brown bear coding at a cyan laptop with a small white coffee mug.",
    "category": "\u5409\u7965\u7269",
    "author": "xxhh0822",
    "authorHandle": "xxhh0822",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.webp",
    "thumbnail": "assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822-thumb.webp",
    "version": 2,
    "tags": [
      "bear",
      "coding",
      "laptop",
      "coffee",
      "chibi",
      "original",
      "ai-generated",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu-codebrew-bear--xxhh0822",
    "license": "CC BY-NC 4.0. Original AI-assisted artwork submitted by xxhh0822 for non-commercial use; no third-party source pixels were copied.",
    "download": "assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/bubu-codebrew-bear--xxhh0822",
    "spritesheetSha256": "20c82a9e88e9561ab3a6f632d8eed1cca5df755fcb500ccdf9a4b576e69e1334",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/xxhh0822"
  },
  {
    "id": "koukou-penguin--hoody",
    "title": "\u6263\u6263\u4F01\u9E45",
    "englishTitle": "\u6263\u6263\u4F01\u9E45",
    "description": "\u4E00\u53EA\u6234\u7740\u7EA2\u56F4\u5DFE\u3001\u4F1A\u7728\u773C\u7684\u5706\u6EDA\u6EDA\u9ED1\u767D\u4F01\u9E45\u4F19\u4F34\u3002",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "hoody",
    "authorHandle": "hoody",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/koukou-penguin--hoody.webp",
    "thumbnail": "assets/pets/upstream-20261009/koukou-penguin--hoody-thumb.webp",
    "version": 2,
    "tags": [
      "penguin",
      "animal",
      "red-scarf",
      "3d-toy",
      "original"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/koukou-penguin--hoody",
    "license": "CC BY-NC 4.0. Original asset created by hoody; no third-party source asset.",
    "download": "assets/pets/upstream-20261009/koukou-penguin--hoody.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/koukou-penguin--hoody",
    "spritesheetSha256": "53f3a730f8485d351976b51c7b918953381a92be95387df17d481069f5defa5c",
    "metadataNameAlias": false
  },
  {
    "id": "xuxu-baobao--legeling",
    "title": "\u65ED\u65ED\u5B9D\u5B9D",
    "englishTitle": "\u65ED\u65ED\u5B9D\u5B9D",
    "description": "An AI-generated miniature avatar based on the reference supplied with request #115, with nine animation states and sixteen look directions. The accepted scope is the V2 sprite package; custom desktop interaction and voice features are outside this delivery.",
    "category": "\u4EBA\u7269\u5934\u50CF",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xuxu-baobao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/xuxu-baobao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "human-avatar",
      "ai-generated",
      "codex-v2",
      "community-request"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xuxu-baobao--legeling",
    "license": "CC BY-NC 4.0 for this AI-generated sprite asset; non-commercial use only. Commercial use is prohibited. Rights in the depicted person's identity and supplied reference photograph remain with their respective rights holders.",
    "download": "assets/pets/upstream-20261009/xuxu-baobao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xuxu-baobao--legeling",
    "spritesheetSha256": "fee42cb0b3a51735520ba506534b9c78583eea7ac2948fd48332c220806ee9a0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "hance-woniu--korn",
    "title": "\u65F1\u5395\u8717\u725B",
    "englishTitle": "\u65F1\u5395\u8717\u725B",
    "description": "\u4E00\u4E2A\u61A8\u61A8\u5FAE\u7B11\u3001\u5634\u89D2\u6302\u7740\u84DD\u8272\u53E3\u6C34\u7684\u767D\u8272\u5706\u5934\u7F51\u7EDC\u6897\u5BA0\u7269\u3002",
    "category": "\u7F51\u7EDC\u6897\u56FE",
    "author": "korn",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hance-woniu--korn.webp",
    "thumbnail": "assets/pets/upstream-20261009/hance-woniu--korn-thumb.webp",
    "version": 2,
    "tags": [
      "meme",
      "douyin",
      "white-mascot",
      "drool",
      "hand-drawn",
      "codex-v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hance-woniu--korn",
    "license": "CC BY-NC 4.0 (korn's original three-view artwork and this Codex pet adaptation only; no claim over third-party meme materials)",
    "download": "assets/pets/upstream-20261009/hance-woniu--korn.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hance-woniu--korn",
    "spritesheetSha256": "8ba2e9a2964c88f93b533e35fc69148da6d314e74711c86fd4231e09a4305255",
    "metadataNameAlias": false
  },
  {
    "id": "liubao--killyer",
    "title": "\u69B4\u5B9D",
    "englishTitle": "\u69B4\u5B9D",
    "description": "\u4E00\u53EA\u5706\u6EDA\u6EDA\u3001\u67D4\u8F6F\u4EB2\u5207\u7684\u69B4\u83B2\u6BDB\u7ED2\u684C\u9762\u5BA0\u7269\u3002",
    "category": "\u539F\u521B\u89D2\u8272",
    "author": "Shawnzhou",
    "authorHandle": "",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/liubao--killyer.webp",
    "thumbnail": "assets/pets/upstream-20261009/liubao--killyer-thumb.webp",
    "version": 2,
    "tags": [
      "original",
      "durian",
      "plush",
      "cute"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liubao--killyer",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/liubao--killyer.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/liubao--killyer",
    "spritesheetSha256": "65954ab3eeb02772ebac5f4fb05279fa5d2f88bd93c4132eea54d3a3b50d9b4b",
    "metadataNameAlias": false
  },
  {
    "id": "shen-xinghui--legeling",
    "title": "\u6C88\u661F\u56DE",
    "englishTitle": "\u6C88\u661F\u56DE",
    "description": "\u4E00\u4F4D\u94F6\u7070\u53D1\u3001\u84DD\u7D2B\u773C\u3001\u8EAB\u7740\u6D45\u8272\u672A\u6765\u5236\u670D\u7684\u6E29\u67D4 Q \u7248\u4F19\u4F34\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/shen-xinghui--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/shen-xinghui--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "love-and-deepspace",
      "shen-xinghui",
      "community-request",
      "ai-generated",
      "fan-art",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shen-xinghui--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u300A\u604B\u4E0E\u6DF1\u7A7A\u300B\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",
    "download": "assets/pets/upstream-20261009/shen-xinghui--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/shen-xinghui--legeling",
    "spritesheetSha256": "d9fd7cfd22d33fb00a7ee6f5f1d29baa68919cb14ac1bda55ea1d8426c6e7ef3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "otama--legeling",
    "title": "\u6D77\u8D3C\u738B\u5C0F\u7389",
    "englishTitle": "\u6D77\u8D3C\u738B\u5C0F\u7389",
    "description": "\u300A\u6D77\u8D3C\u738B\u300B\u5C0F\u7389\uFF0C\u4FDD\u7559\u7D2B\u53D1\u82B1\u9970\u3001\u7EFF\u8272\u8865\u4E01\u548C\u670D\u3001\u9EC4\u8272\u8170\u5E26\u4E0E\u8349\u5C65\u7684 V2 \u52A8\u753B\u5BA0\u7269\u3002",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/otama--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/otama--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "one-piece",
      "otama"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/otama--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/otama--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/otama--legeling",
    "spritesheetSha256": "df03b7e1628e5693dfeb324302b1920fe81eec427465488338f13aca5a3e35f3",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "neptune--legeling",
    "title": "\u6D85\u666E\u7F07\u52AA",
    "englishTitle": "Neptune",
    "description": "\u6309\u793E\u533A\u8BF7\u6C42\u5236\u4F5C\u7684\u6D85\u666E\u7F07\u52AA\u666E\u901A\u5F62\u6001\u50CF\u7D20\u98CE\u540C\u4EBA\u5BA0\u7269\uFF0C\u767D\u7D2B\u8FDE\u5E3D\u5916\u5957\u3001\u65B9\u5411\u952E\u53D1\u5939\u548C\u7D2B\u8272\u978B\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/neptune--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/neptune--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "neptunia",
      "pixel-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/neptune--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/neptune--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/neptune--legeling",
    "spritesheetSha256": "3a53c81e95231edb55c20393f417a9d8bfa3f278a7e22d05d9a185ad3432d28e",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "niulai--legeling",
    "title": "\u725B\u6765",
    "englishTitle": "\u725B\u6765",
    "description": "\u4E00\u53EA\u6A59\u68D5\u8272\u3001\u77ED\u7070\u89D2\u3001\u5706\u773C\u548C\u6D45\u7C89\u53E3\u9F3B\u7684\u61A8\u840C Q \u7248\u725B\u4F19\u4F34\u3002",
    "category": "\u7F51\u7EDC\u6897\u56FE",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/niulai--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/niulai--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "niulai",
      "community-request",
      "ai-generated",
      "meme",
      "3d-toy",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niulai--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u7D20\u6750\u76F8\u5173\u6743\u5229\u65B9\u6388\u6743\u3002",
    "download": "assets/pets/upstream-20261009/niulai--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/niulai--legeling",
    "spritesheetSha256": "dd95068c122aecebbb4056918eba49513e4969cb00b503b9494319f2b410e399",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "gift--legeling",
    "title": "\u793C\u7269",
    "englishTitle": "Gift",
    "description": "A round tabby-white cat with green-yellow eyes, white paws and a thick ringed tail.",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/gift--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/gift--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gift--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/gift--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/gift--legeling",
    "spritesheetSha256": "978c742dcdc54d5260ba61a8337491acfe8f5969caa26f0b232d9e9ba5301617",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "luo-xiaohei--legeling",
    "title": "\u7F57\u5C0F\u9ED1",
    "englishTitle": "\u7F57\u5C0F\u9ED1",
    "description": "\u4E00\u4F4D\u9ED1\u53D1\u3001\u7EFF\u773C\u3001\u6DE1\u7EFF\u89D2\u9970\u3001\u84DD\u8272\u4E0A\u8863\u4E0E\u5C0F\u9ED1\u5C3E\u5DF4\u7684 Q \u7248\u68EE\u6797\u4F19\u4F34\u3002",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/luo-xiaohei--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/luo-xiaohei--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "luo-xiaohei",
      "community-request",
      "ai-generated",
      "anime",
      "forest-child",
      "sticker",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/luo-xiaohei--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u76F8\u5173\u89D2\u8272\u6216\u5546\u6807\u6743\u5229\u65B9\u6388\u6743\u3002",
    "download": "assets/pets/upstream-20261009/luo-xiaohei--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/luo-xiaohei--legeling",
    "spritesheetSha256": "52c8feff0a688e6b18791e452d5eff090823fcaf8306f8f1f8da64e30e15c468",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "xiang-an--legeling",
    "title": "\u7FD4\u5B89",
    "englishTitle": "\u7FD4\u5B89",
    "description": "\u4E00\u5BF9\u5F69\u8272\u5916\u5957\u4E0E\u8584\u8377\u7EFF\u8FDE\u4F53\u8863\u7684 Q \u7248\u5144\u5F1F\u642D\u6863\u3002",
    "category": "\u4EBA\u7269\u5934\u50CF",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/xiang-an--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/xiang-an--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "ai-generated",
      "sibling-duo",
      "chibi",
      "sticker",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiang-an--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002",
    "download": "assets/pets/upstream-20261009/xiang-an--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/xiang-an--legeling",
    "spritesheetSha256": "1e9a5dd74676341e18ec23752c877c94f293a3bb7ab91ff5a8ad7166bb2cd4ad",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "maodie--octane0411",
    "title": "\u8004\u800B",
    "englishTitle": "\u8004\u800B",
    "description": "\u4E00\u53EA\u5706\u5934\u98DE\u673A\u8033\u3001\u7C89\u9F3B\u772F\u773C\uFF0C\u51F6\u840C\u53C8\u5014\u5F3A\u7684\u6A58\u767D\u732B\u3002",
    "category": "\u7F51\u7EDC\u6897\u56FE",
    "author": "Octane0411",
    "authorHandle": "Octane0411",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/maodie--octane0411.webp",
    "thumbnail": "assets/pets/upstream-20261009/maodie--octane0411-thumb.webp",
    "version": 2,
    "tags": [
      "cat",
      "orange-cat",
      "meme",
      "maodie",
      "codex-v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/maodie--octane0411",
    "license": "CC BY 4.0",
    "download": "assets/pets/upstream-20261009/maodie--octane0411.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/maodie--octane0411",
    "spritesheetSha256": "eb819e188df3efc8dc7c0ac11d6533fb01cfe869a56a80835fd44fc6882517d5",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/Octane0411"
  },
  {
    "id": "nijika--amia",
    "title": "\u8679\u590F",
    "englishTitle": "Nijika Ijichi",
    "description": "\u4F0A\u5730\u77E5\u8679\u590F\u3002\u4E0B\u5317\u6CFD\u5927\u5929\u4F7F\uFF01\u793E\u533A\u4F5C\u8005\uFF1AAmia\u306D",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "Amia\u306D",
    "authorHandle": "amiaverse",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/nijika--amia.webp",
    "thumbnail": "assets/pets/upstream-20261009/nijika--amia-thumb.webp",
    "version": 2,
    "tags": [
      "anime",
      "music",
      "drummer",
      "bocchi-the-rock",
      "fan-art"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nijika--amia",
    "license": "Non-commercial use and redistribution with attribution to Amia\u306D; original character and design rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/nijika--amia.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "bocchi-the-rock"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/nijika--amia",
    "spritesheetSha256": "85e14504b95e92ea77c362174bb1979a8a067f55a67b1915f33721eaa66451f9",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/amiaverse"
  },
  {
    "id": "hongmao--legeling",
    "title": "\u8679\u732B\u5C11\u4FA0",
    "englishTitle": "\u8679\u732B\u5C11\u4FA0",
    "description": "A young orange cat swordsman in white martial clothing, a yellow scarf and an orange cape, holding his orange-red sword.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/hongmao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/hongmao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "v2"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hongmao--legeling",
    "license": "CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",
    "download": "assets/pets/upstream-20261009/hongmao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/hongmao--legeling",
    "spritesheetSha256": "4022eb2d77c1641c95d548e033aa496a45376f3facc932accf206e62492ac4aa",
    "metadataNameAlias": true,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "jinmao--legeling",
    "title": "\u91D1\u6BDB",
    "englishTitle": "\u91D1\u6BDB",
    "description": "\u4E00\u53EA\u53FC\u7740\u7F51\u7403\u3001\u5782\u7740\u5927\u8033\u6735\u7684\u5976\u6CB9\u6D45\u91D1\u8272\u6CBB\u6108\u7CFB\u91D1\u6BDB\u5E7C\u72AC\u3002",
    "category": "\u52A8\u7269\u4F19\u4F34",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/jinmao--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/jinmao--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "golden-retriever",
      "dog",
      "puppy",
      "tennis-ball",
      "community-request",
      "ai-generated",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/jinmao--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/jinmao--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "animal-companions"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/jinmao--legeling",
    "spritesheetSha256": "1845ef8174a902f72fe269af9e22efff5c2cab9e0bb9aa330a0acb40569a74f6",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "arona--legeling",
    "title": "\u963F\u7F57\u90A3",
    "englishTitle": "\u963F\u7F57\u90A3",
    "description": "\u4E00\u4F4D\u6D45\u84DD\u77ED\u53D1\u3001\u9752\u8272\u5149\u73AF\u4E0E\u6C34\u624B\u670D\u7684 Q \u7248\u6821\u56ED\u4F19\u4F34\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/arona--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/arona--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "blue-archive",
      "arona",
      "community-request",
      "ai-generated",
      "fan-art",
      "chibi",
      "v2",
      "look-directions"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arona--legeling",
    "license": "CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u300A\u78A7\u84DD\u6863\u6848\u300B\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",
    "download": "assets/pets/upstream-20261009/arona--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/arona--legeling",
    "spritesheetSha256": "4140848d8c5cc7831f78d200101910ba831a63a8ad9de6f085b15bcf14bec1d0",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "zayne--legeling",
    "title": "\u9ECE\u6DF1",
    "englishTitle": "Zayne",
    "description": "\u6309\u793E\u533A\u793C\u670D\u53C2\u8003\u5236\u4F5C\u7684\u300A\u604B\u4E0E\u6DF1\u7A7A\u300B\u9ECE\u6DF1 3D Q\u7248\u540C\u4EBA\u5BA0\u7269\uFF0C\u4FDD\u7559\u7EFF\u773C\u3001\u96EA\u82B1\u80F8\u9488\u4E0E\u7EC6\u94FE\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",
    "category": "\u6E38\u620F\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/zayne--legeling.webp",
    "thumbnail": "assets/pets/upstream-20261009/zayne--legeling-thumb.webp",
    "version": 2,
    "tags": [
      "community-request",
      "love-and-deepspace",
      "chibi-3d"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/zayne--legeling",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/zayne--legeling.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/zayne--legeling",
    "spritesheetSha256": "e6f9f91eb5a32f240766b96447f4a847f4fdf2b772a9c6a6ac989b6e9ef788aa",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  },
  {
    "id": "bocchi--lingxiaotian",
    "title": "\u540E\u85E4\u72EC",
    "englishTitle": "Bocchi",
    "description": "A compact Codex digital pet inspired by Bocchi from Bocchi the Rock.",
    "category": "\u52A8\u6F2B\u89D2\u8272",
    "author": "legeling",
    "authorHandle": "legeling",
    "kind": "pet",
    "atlas": "assets/pets/upstream-20261009/bocchi--lingxiaotian.webp",
    "thumbnail": "assets/pets/upstream-20261009/bocchi--lingxiaotian-thumb.webp",
    "version": 1,
    "tags": [
      "anime",
      "music",
      "guitar",
      "bocchi-the-rock",
      "pink-hair"
    ],
    "source": "https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bocchi--lingxiaotian",
    "license": "CC BY-NC 4.0",
    "download": "assets/pets/upstream-20261009/bocchi--lingxiaotian.zip",
    "date": "",
    "importedAt": "2026-10-09",
    "collections": [
      "bocchi-the-rock"
    ],
    "upstreamCommit": "0d0f06bb1721aef4ddbc7f893276f235ed8458ec",
    "assetsLicenseSource": "https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",
    "assetSource": "upstream-pets/bocchi--lingxiaotian",
    "spritesheetSha256": "d8514dac88d4811c9f238530602f22721f5e2368d5b05238ff906251d457eb72",
    "metadataNameAlias": false,
    "authorUrl": "https://github.com/legeling"
  }
];
export function petCredit(work) {
  return { author: work.author, source: work.source, license: work.license };
}
export function petDisplayAuthor(work) {
  return work.id === cat.id ? '\u4E0A\u6E38\u793A\u4F8B\uFF08\u4F5C\u8005\u5F85\u6838\u5B9E\uFF09' : work.author;
}

// \u53EF\u9009\u5DE5\u5177\u662F\u5BBF\u4E3B\u652F\u6301\u7684\u771F\u5B9E SDK V3 \u63D2\u4EF6\uFF0C\u4E0D\u8FDB\u5165\u58F0\u660E\u5F0F\u63D0\u9192\u7F16\u8F91\u5668\u3002
export const toolPlugins = [
  {
    id: 'lingyin.file-assistant', title: '\u6587\u4EF6\u52A9\u624B', kind: 'plugin', pluginType: 'host-tool',
    description: '\u5FEB\u901F\u5B9A\u4F4D\u6587\u4EF6\u3001\u6253\u5F00\u76EE\u5F55\u3001\u865A\u62DF\u5206\u7C7B\u5E93\u4E0E\u53EF\u64A4\u9500\u63A8\u8350\u6574\u7406\uFF1B\u53EF\u4F7F\u7528\u4F60\u914D\u7F6E\u7684 AI \u5BA1\u6838\u5206\u7C7B\u3002',
    category: '\u53EF\u9009\u5DE5\u5177', author: projectAuthor, symbol: '\u6587', version: '1.0.0',
    sourceFolder: 'lingyin-file-assistant', source: '\u672C\u9879\u76EE plugins/community/lingyin-file-assistant', license: 'MIT\uFF08\u63D2\u4EF6\u6E05\u5355\u4E0E\u5165\u53E3\u4EE3\u7801\uFF09',
    download: 'assets/lingyin.file-assistant.zip', permissions: ['files', 'status'],
    permissionLabels: ['\u672C\u673A\u6587\u4EF6\u529F\u80FD', '\u63D2\u4EF6\u72B6\u6001'],
    features: ['\u8BE2\u95EE\u6587\u4EF6\u4F4D\u7F6E\u5E76\u6253\u5F00\u5BF9\u5E94\u6587\u4EF6\u5939', '\u865A\u62DF\u5206\u7C7B\u5E93\u4FDD\u7559\u539F\u4EF6\u4F4D\u7F6E', '\u6309\u63A8\u8350\u6574\u7406\u9700\u4E3B\u52A8\u9009\u62E9\uFF0C\u53EF\u6309\u8BB0\u5F55\u64A4\u9500', '\u4F7F\u7528\u672C\u5730\u5DF2\u914D\u7F6E\u7684 AI \u5BA1\u6838\u5206\u7C7B'],
    hostNotice: '\u8FD9\u662F desktop pet \u5BBF\u4E3B\u5DE5\u5177\u63D2\u4EF6\u3002\u5B89\u88C5\u3001\u786E\u8BA4\u6743\u9650\u5E76\u542F\u7528\u540E\uFF0C\u4ECE\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u6574\u7406\u6216\u5220\u9664\u6587\u4EF6\u3002',
  },
  {
    id: 'lingyin.computer-care', title: '\u7535\u8111\u5B88\u62A4', kind: 'plugin', pluginType: 'host-tool',
    description: '\u5185\u5B58\u3001\u78C1\u76D8\u4E0E\u81EA\u542F\u8BCA\u65AD\u5EFA\u8BAE\uFF0C\u4E0B\u8F7D\u98CE\u9669\u63D0\u9192\u3001\u5B89\u88C5\u5305\u53EA\u8BFB\u68C0\u67E5\u53CA\u5378\u8F7D\u76EE\u5F55\u6838\u5BF9\u3002',
    category: '\u53EF\u9009\u5DE5\u5177', author: projectAuthor, symbol: '\u62A4', version: '1.0.0',
    sourceFolder: 'lingyin-computer-care', source: '\u672C\u9879\u76EE plugins/community/lingyin-computer-care', license: 'MIT\uFF08\u63D2\u4EF6\u6E05\u5355\u4E0E\u5165\u53E3\u4EE3\u7801\uFF09',
    download: 'assets/lingyin.computer-care.zip', permissions: ['files', 'system:metrics', 'status'],
    permissionLabels: ['\u7528\u6237\u9009\u62E9\u7684\u6587\u4EF6\u4E0E\u76EE\u5F55', '\u7535\u8111\u8D44\u6E90\u8BFB\u53D6', '\u63D2\u4EF6\u72B6\u6001'],
    features: ['\u5185\u5B58\u3001\u78C1\u76D8\u4E0E\u81EA\u542F\u8BCA\u65AD\u53CA\u4FDD\u5B58\u8DEF\u5F84\u7B49\u5EFA\u8BAE', '\u7528\u6237\u5F00\u542F\u540E\u63D0\u9192\u53EF\u80FD\u6709\u6346\u7ED1\u98CE\u9669\u7684\u4E0B\u8F7D\u884C\u4E3A', '\u9009\u62E9 EXE/MSI \u5B89\u88C5\u5305\u540E\u53EA\u8BFB\u68C0\u67E5\uFF0C\u4E0D\u6267\u884C\u5B89\u88C5', '\u6838\u5BF9\u9009\u62E9\u7684\u5378\u8F7D\u76EE\u5F55\uFF0C\u4E0D\u81EA\u52A8\u5378\u8F7D\u6216\u5220\u9664'],
    hostNotice: '\u8FD9\u662F desktop pet \u5BBF\u4E3B\u5DE5\u5177\u63D2\u4EF6\u3002\u5B89\u88C5\u3001\u786E\u8BA4\u6743\u9650\u5E76\u542F\u7528\u540E\uFF0C\u4ECE\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\uFF1B\u4E0B\u8F7D\u76D1\u6D4B\u7531\u4F60\u5F00\u542F\uFF0C\u98CE\u9669\u63D0\u793A\u4E0D\u4EE3\u8868\u5B89\u88C5\u5305\u5B89\u5168\u4FDD\u8BC1\u3002',
  },
];
`,type:"text/javascript; charset=utf-8"},"/plugin-catalog.js":{body:`// \u7531\u516C\u5F00\u63D2\u4EF6\u6E90\u7801\u751F\u6210\uFF0C\u4E0D\u5305\u542B\u7528\u6237\u6863\u6848\u6216\u8FD0\u884C\u914D\u7F6E\u3002
export const sourcePlugins = [
  {
    "id": "openpets.reminders",
    "title": "\u5FEB\u901F\u63D0\u9192",
    "description": "\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8BBE\u7F6E\u7B80\u77ED\u7684\u672C\u5730\u63D0\u9192\uFF0C\u5230\u70B9\u65F6\u4F1A\u901A\u8FC7\u58F0\u97F3\u3001\u89D2\u6807\u548C\u53EF\u7A0D\u540E\u63D0\u9192\u7684\u60AC\u6D6E\u6C14\u6CE1\u901A\u77E5\u4F60\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u63D0\u9192\u4E0E\u8BA1\u65F6",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u63D0",
    "version": "1.2.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.reminders",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.reminders.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "audio",
      "schedule",
      "storage",
      "commands",
      "status",
      "notify"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u58F0\u97F3",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001",
      "\u7CFB\u7EDF\u63D0\u9192"
    ],
    "features": [
      "\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8BBE\u7F6E\u7B80\u77ED\u7684\u672C\u5730\u63D0\u9192\uFF0C\u5230\u70B9\u65F6\u4F1A\u901A\u8FC7\u58F0\u97F3\u3001\u89D2\u6807\u548C\u53EF\u7A0D\u540E\u63D0\u9192\u7684\u60AC\u6D6E\u6C14\u6CE1\u901A\u77E5\u4F60\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.reminders",
    "sha256": "69f891c89e23c1f7f639a2326b1ff4de18bba19977985a487a3b940b942868cc",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.simple-timer",
    "title": "\u8F7B\u91CF\u8BA1\u65F6\u5668",
    "description": "A one-shot countdown timer with a pet HUD, pause controls, and an expiry alert.",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u63D0\u9192\u4E0E\u8BA1\u65F6",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u65F6",
    "version": "1.1.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.simple-timer",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.simple-timer.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "pet:pin",
      "audio",
      "schedule",
      "storage",
      "commands",
      "status",
      "notify"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u56FA\u5B9A\u6C14\u6CE1",
      "\u58F0\u97F3",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001",
      "\u7CFB\u7EDF\u63D0\u9192"
    ],
    "features": [
      "A one-shot countdown timer with a pet HUD, pause controls, and an expiry alert.",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.simple-timer",
    "sha256": "a82367cd2e7c15e24171cda2d25e916e0b7cc75675db01cd319d995a7d21d861",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.anxiety-aid-tools",
    "title": "Anxiety Aid Tools",
    "description": "\u56F4\u7ED5\u5BA0\u7269\u8FDB\u884C\u7684\u5E73\u9759\u7EC3\u4E60\uFF1A\u547C\u5438\u3001\u808C\u8089\u653E\u677E\u3001\u7740\u9646\u7EC3\u4E60\u3001\u5F15\u5BFC\u51A5\u60F3\u3001\u610F\u8C61\u653E\u677E\u4E0E\u8212\u7F13\u58F0\u97F3\u3002https://anxietyaidtools.com/ \u7684 desktop pet \u4F34\u4FA3\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u8EAB\u5FC3\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u5FC3",
    "version": "0.1.1",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.anxiety-aid-tools",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.anxiety-aid-tools.zip",
    "permissions": [
      "ui:session",
      "commands",
      "storage",
      "network"
    ],
    "permissionLabels": [
      "\u7EC3\u4E60\u9762\u677F",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u7F51\u7EDC\u8BBF\u95EE"
    ],
    "features": [
      "\u56F4\u7ED5\u5BA0\u7269\u8FDB\u884C\u7684\u5E73\u9759\u7EC3\u4E60\uFF1A\u547C\u5438\u3001\u808C\u8089\u653E\u677E\u3001\u7740\u9646\u7EC3\u4E60\u3001\u5F15\u5BFC\u51A5\u60F3\u3001\u610F\u8C61\u653E\u677E\u4E0E\u8212\u7F13\u58F0\u97F3\u3002https://anxietyaidtools.com/ \u7684 desktop pet \u4F34\u4FA3\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.anxiety-aid-tools",
    "sha256": "b9b337f47d13b91b607aa5f8b1720540d18090c277a024c18fec90e7bc795c5d",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.focus-buddy",
    "title": "\u4E13\u6CE8\u4F19\u4F34",
    "description": "\u4E00\u4E2A\u5BA0\u7269\u756A\u8304\u949F\u5F0F\u4E13\u6CE8\u8BA1\u65F6\u5668\uFF0C\u5E2E\u4F60\u4E13\u6CE8\uFF0C\u5E76\u63D0\u9192\u4F60\u4F11\u606F\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u63D0\u9192\u4E0E\u8BA1\u65F6",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u4E13",
    "version": "1.2.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.focus-buddy",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.focus-buddy.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "pet:pin",
      "schedule",
      "storage",
      "commands",
      "status",
      "audio"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u56FA\u5B9A\u6C14\u6CE1",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001",
      "\u58F0\u97F3"
    ],
    "features": [
      "\u4E00\u4E2A\u5BA0\u7269\u756A\u8304\u949F\u5F0F\u4E13\u6CE8\u8BA1\u65F6\u5668\uFF0C\u5E2E\u4F60\u4E13\u6CE8\uFF0C\u5E76\u63D0\u9192\u4F60\u4F11\u606F\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.focus-buddy",
    "sha256": "045b99a3bb461de04995a594b569c4bffba201a2ed937e1397fd6af2353d5c37",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.launch-buddy",
    "title": "\u542F\u52A8\u95EE\u5019",
    "description": "\u53CB\u597D\u7684\u542F\u52A8\u95EE\u5019\uFF0C\u5E26\u6709\u6E29\u548C\u7684\u65F6\u673A\u3001\u53CD\u5E94\u548C\u53EF\u9009\u7684\u58F0\u97F3\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u5019",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.launch-buddy",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.launch-buddy.zip",
    "permissions": [
      "pet:speak",
      "pet:reaction",
      "audio",
      "schedule",
      "storage",
      "commands"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u58F0\u97F3",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4"
    ],
    "features": [
      "\u53CB\u597D\u7684\u542F\u52A8\u95EE\u5019\uFF0C\u5E26\u6709\u6E29\u548C\u7684\u65F6\u673A\u3001\u53CD\u5E94\u548C\u53EF\u9009\u7684\u58F0\u97F3\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.launch-buddy",
    "sha256": "26529303d502ec5fa8f14672a91dd80559a022fd81988929341bf1a7453ae60b",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.fortune-cookie",
    "title": "\u6BCF\u65E5\u5E78\u8FD0\u997C\u5E72",
    "description": "\u4E00\u5757\u5C0F\u5C0F\u5E78\u8FD0\u997C\u5E72\u9001\u6765\u7684\u6E29\u67D4\u6BCF\u65E5\u4FBF\u7B7E\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u7B7E",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.fortune-cookie",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.fortune-cookie.zip",
    "permissions": [
      "pet:speak",
      "schedule",
      "storage",
      "commands"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4"
    ],
    "features": [
      "\u4E00\u5757\u5C0F\u5C0F\u5E78\u8FD0\u997C\u5E72\u9001\u6765\u7684\u6E29\u67D4\u6BCF\u65E5\u4FBF\u7B7E\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.fortune-cookie",
    "sha256": "31785f20974e7921b0def5b88bbcd7a4aa34926cf09b35ec2d9b21297c22bb9f",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.virtual-pet",
    "title": "\u865A\u62DF\u5BA0\u7269",
    "description": "\u7167\u987E\u4E00\u4E2A\u5C0F\u5C0F\u7684\u684C\u9762\u4F19\u4F34\uFF0C\u901A\u8FC7\u6E29\u67D4\u7684\u65E5\u5E38\u4E92\u52A8\u770B\u7740\u4F60\u4EEC\u7684\u7F81\u7ECA\u6210\u957F\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u5BA0",
    "version": "1.2.2",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.virtual-pet",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.virtual-pet.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "pet:pin",
      "pet:reaction",
      "schedule",
      "storage",
      "commands",
      "audio",
      "events",
      "bus"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u56FA\u5B9A\u6C14\u6CE1",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u58F0\u97F3",
      "\u4EA4\u4E92\u4E8B\u4EF6",
      "\u63D2\u4EF6\u534F\u540C"
    ],
    "features": [
      "\u7167\u987E\u4E00\u4E2A\u5C0F\u5C0F\u7684\u684C\u9762\u4F19\u4F34\uFF0C\u901A\u8FC7\u6E29\u67D4\u7684\u65E5\u5E38\u4E92\u52A8\u770B\u7740\u4F60\u4EEC\u7684\u7F81\u7ECA\u6210\u957F\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.virtual-pet",
    "sha256": "36e88d3ab8e4e2aefaf082e424aff83c3c734845a933de7af83c67e4069b8f30",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.life-companion",
    "title": "\u751F\u6D3B\u4F19\u4F34",
    "description": "\u6309\u9700\u5065\u5EB7\u63D0\u9192\u3001\u4E3B\u52A8\u7167\u987E\u548C\u62D6\u62FD\u53CD\u9988\u3002\u968F\u673A\u52A8\u4F5C\u4E0E\u5B89\u9759\u6A21\u5F0F\u5728\u6211\u7684\u684C\u5BA0\u4E2D\u7EDF\u4E00\u914D\u7F6E\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "Lykinzlj",
    "symbol": "\u4F34",
    "version": "1.1.0",
    "source": "\u672C\u9879\u76EE plugins/official/openpets.life-companion",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.life-companion.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "pets:read",
      "schedule",
      "storage",
      "commands",
      "events",
      "bus"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u684C\u5BA0\u72B6\u6001",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u4EA4\u4E92\u4E8B\u4EF6",
      "\u63D2\u4EF6\u534F\u540C"
    ],
    "features": [
      "\u6309\u9700\u5065\u5EB7\u63D0\u9192\u3001\u4E3B\u52A8\u7167\u987E\u548C\u62D6\u62FD\u53CD\u9988\u3002\u968F\u673A\u52A8\u4F5C\u4E0E\u5B89\u9759\u6A21\u5F0F\u5728\u6211\u7684\u684C\u5BA0\u4E2D\u7EDF\u4E00\u914D\u7F6E\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.life-companion",
    "sha256": "630709bdc3ed8f816bf9e963d0cd6b2c4e8f0f6fdc6bcc227999cbf19b7f71ec",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.water-reminder",
    "title": "\u559D\u6C34\u63D0\u9192",
    "description": "\u8BA9\u5BA0\u7269\u6E29\u67D4\u63D0\u9192\u4F60\u559D\u70B9\u6C34\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u63D0\u9192\u4E0E\u8BA1\u65F6",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u6C34",
    "version": "1.0.1",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.water-reminder",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.water-reminder.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "audio",
      "schedule",
      "storage",
      "commands"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u58F0\u97F3",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4"
    ],
    "features": [
      "\u8BA9\u5BA0\u7269\u6E29\u67D4\u63D0\u9192\u4F60\u559D\u70B9\u6C34\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.water-reminder",
    "sha256": "36da575e91abaa1acb9a3421b6b3712d249ed6e98b15d8c9001ff1f5fc3ba6df",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.system-resources",
    "title": "\u7CFB\u7EDF\u8D44\u6E90",
    "description": "\u5728\u5BA0\u7269\u4E0A\u663E\u793A\u5B9E\u65F6 CPU \u548C\u5185\u5B58\u4EEA\u8868\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 GPU \u548C\u78C1\u76D8\u6307\u6807\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u8D44\u6E90\u4E0E\u5DE5\u5177",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "Karim Bouwmans",
    "symbol": "\u4EEA",
    "version": "2.2.0",
    "source": "https://github.com/OpenPetsHQ/Openpets-system-resources",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.system-resources.zip",
    "permissions": [
      "pet:speak",
      "pet:reaction",
      "pet:pin",
      "schedule",
      "storage",
      "commands",
      "status",
      "events",
      "system:metrics"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u56FA\u5B9A\u6C14\u6CE1",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001",
      "\u4EA4\u4E92\u4E8B\u4EF6",
      "\u53EA\u8BFB\u8D44\u6E90\u6307\u6807"
    ],
    "features": [
      "\u5728\u5BA0\u7269\u4E0A\u663E\u793A\u5B9E\u65F6 CPU \u548C\u5185\u5B58\u4EEA\u8868\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 GPU \u548C\u78C1\u76D8\u6307\u6807\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.system-resources",
    "sha256": "89adb44a21f900d1ffb72baac8b5ec7deb56b4a19f8219f1c8044941de3ae108",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.calendar-airmail",
    "title": "\u65E5\u5386\u822A\u7A7A\u90AE\u4EF6",
    "description": "\u901A\u8FC7\u6240\u9009\u4FE1\u4F7F\u4EE5\u822A\u7A7A\u90AE\u4EF6\u65B9\u5F0F\u53D1\u9001 Google \u65E5\u5386\u6D3B\u52A8\u63D0\u9192\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u8D44\u6E90\u4E0E\u5DE5\u5177",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u5386",
    "version": "1.2.3",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.calendar-airmail",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.calendar-airmail.zip",
    "permissions": [
      "ui:delivery",
      "auth",
      "network",
      "schedule",
      "storage",
      "commands",
      "status"
    ],
    "permissionLabels": [
      "\u4FE1\u4F7F\u63D0\u9192",
      "\u5916\u90E8\u670D\u52A1\u6388\u6743",
      "\u7F51\u7EDC\u8BBF\u95EE",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001"
    ],
    "features": [
      "\u901A\u8FC7\u6240\u9009\u4FE1\u4F7F\u4EE5\u822A\u7A7A\u90AE\u4EF6\u65B9\u5F0F\u53D1\u9001 Google \u65E5\u5386\u6D3B\u52A8\u63D0\u9192\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.calendar-airmail",
    "sha256": "654b36a22a184833394cdd5eb23e6768bbd422a5556c8c13acb898bbb22420d1",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.day-routine",
    "title": "\u65E9\u665A\u65E5\u5E38",
    "description": "\u6E29\u548C\u7684\u6BCF\u65E5\u966A\u4F34\uFF0C\u548C\u4F60\u7684\u5BA0\u7269\u4E00\u8D77\u5F00\u59CB\u5E76\u6536\u8D77\u4E00\u5929\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u6668",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.day-routine",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.day-routine.zip",
    "permissions": [
      "pet:speak",
      "schedule",
      "storage",
      "commands"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4"
    ],
    "features": [
      "\u6E29\u548C\u7684\u6BCF\u65E5\u966A\u4F34\uFF0C\u548C\u4F60\u7684\u5BA0\u7269\u4E00\u8D77\u5F00\u59CB\u5E76\u6536\u8D77\u4E00\u5929\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.day-routine",
    "sha256": "dba10f72653453d96c6c5f9a54d436a1b14345453211fd17c6c05169db60767d",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.magic-8-ball",
    "title": "\u9B54\u6CD5 8 \u53F7\u7403",
    "description": "\u95EE\u4E00\u4E2A\u8F7B\u677E\u7684\u95EE\u9898\uFF0C\u8BA9\u5BA0\u7269\u7ED9\u4F60\u6E29\u6696\u53C8\u4FCF\u76AE\u7684\u56DE\u7B54\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u7403",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.magic-8-ball",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.magic-8-ball.zip",
    "permissions": [
      "pet:speak",
      "commands",
      "storage"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u63D2\u4EF6\u5B58\u6863"
    ],
    "features": [
      "\u95EE\u4E00\u4E2A\u8F7B\u677E\u7684\u95EE\u9898\uFF0C\u8BA9\u5BA0\u7269\u7ED9\u4F60\u6E29\u6696\u53C8\u4FCF\u76AE\u7684\u56DE\u7B54\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.magic-8-ball",
    "sha256": "d18c6c50bdaf6490a94ba95db130a0352c5775b44187170944624ba48549f260",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "openpets.mood-check-in",
    "title": "\u5FC3\u60C5\u7B7E\u5230",
    "description": "\u6BCF\u5929\u4E00\u6B21\u6E29\u548C\u5730\u7559\u610F\u4F60\u5F53\u4E0B\u7684\u611F\u53D7\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u8EAB\u5FC3\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u6674",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.mood-check-in",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.mood-check-in.zip",
    "permissions": [
      "pet:speak",
      "pet:interact",
      "schedule",
      "storage",
      "commands"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u4E3B\u52A8\u547D\u4EE4"
    ],
    "features": [
      "\u6BCF\u5929\u4E00\u6B21\u6E29\u548C\u5730\u7559\u610F\u4F60\u5F53\u4E0B\u7684\u611F\u53D7\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/official/openpets.mood-check-in",
    "sha256": "3d42c278126f850cd5cfdb8e814b220e84556067f4a361fe22aeb157abed34eb",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"
  },
  {
    "id": "regis.usage-buddy",
    "title": "AI \u989D\u5EA6\u4F19\u4F34",
    "description": "\u4ECE\u53E6\u884C\u8FD0\u884C\u7684\u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\u8BFB\u53D6 Claude\uFF0FCodex \u989D\u5EA6\uFF0C\u5E76\u6309\u914D\u7F6E\u63D0\u9192\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u8D44\u6E90\u4E0E\u5DE5\u5177",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "Regis Benedito dos Santos Bittencourt",
    "symbol": "\u989D",
    "version": "1.1.0",
    "source": "https://github.com/regisbsb/openpets-plugin-usage-buddy",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/regis.usage-buddy.zip",
    "permissions": [
      "pet:speak",
      "pet:reaction",
      "commands",
      "status",
      "schedule",
      "network",
      "network:local",
      "storage"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u7F51\u7EDC\u8BBF\u95EE",
      "\u672C\u673A\u7F51\u7EDC",
      "\u63D2\u4EF6\u5B58\u6863"
    ],
    "features": [
      "\u4ECE\u53E6\u884C\u8FD0\u884C\u7684\u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\u8BFB\u53D6 Claude\uFF0FCodex \u989D\u5EA6\uFF0C\u5E76\u6309\u914D\u7F6E\u63D0\u9192\u3002",
      "\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C usage-monitor-for-claude-and-codex \u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\uFF0C\u5E76\u786E\u8BA4\u63D2\u4EF6\u53EF\u8BBF\u95EE\u5176 127.0.0.1:45455 \u7AEF\u70B9\uFF1B\u63D2\u4EF6\u672C\u8EAB\u4E0D\u76F4\u63A5\u8BFB\u53D6\u4E91\u7AEF\u8D26\u53F7\u989D\u5EA6\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/community/regis.usage-buddy",
    "sha256": "48e03c6b788e610e76a7ae4241e4c26bab9627171d8565a21524ea4e57feb9d0",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",
    "requirements": "\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C usage-monitor-for-claude-and-codex \u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\uFF0C\u5E76\u786E\u8BA4\u63D2\u4EF6\u53EF\u8BBF\u95EE\u5176 127.0.0.1:45455 \u7AEF\u70B9\uFF1B\u63D2\u4EF6\u672C\u8EAB\u4E0D\u76F4\u63A5\u8BFB\u53D6\u4E91\u7AEF\u8D26\u53F7\u989D\u5EA6\u3002"
  },
  {
    "id": "openpets.higgsfield-watch",
    "title": "Higgsfield \u8FDB\u5EA6\u4F19\u4F34",
    "description": "\u914D\u7F6E\u81EA\u5DF1\u7684 Higgsfield \u4EE4\u724C\u540E\uFF0C\u8BA9\u684C\u5BA0\u62A5\u544A\u56FE\u50CF\u4E0E\u89C6\u9891\u751F\u6210\u8FDB\u5EA6\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u8D44\u6E90\u4E0E\u5DE5\u5177",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u7ED8",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.higgsfield-watch",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.higgsfield-watch.zip",
    "permissions": [
      "network",
      "schedule",
      "storage",
      "pet:speak",
      "pet:reaction",
      "commands",
      "status"
    ],
    "permissionLabels": [
      "\u7F51\u7EDC\u8BBF\u95EE",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001"
    ],
    "features": [
      "\u914D\u7F6E\u81EA\u5DF1\u7684 Higgsfield \u4EE4\u724C\u540E\uFF0C\u8BA9\u684C\u5BA0\u62A5\u544A\u56FE\u50CF\u4E0E\u89C6\u9891\u751F\u6210\u8FDB\u5EA6\u3002",
      "\u9700\u8981\u7528\u6237\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u586B\u5199\u81EA\u5DF1\u7684 Higgsfield \u8BBF\u95EE\u4EE4\u724C\uFF0C\u63D2\u4EF6\u4EC5\u5411\u58F0\u660E\u7684 Higgsfield \u670D\u52A1\u67E5\u8BE2\u751F\u6210\u8FDB\u5EA6\uFF1B\u7F51\u7AD9\u4E0D\u63A5\u6536\u4EE4\u724C\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/community/openpets.higgsfield-watch",
    "sha256": "31d3c85dc20396faa78311a0b2180bf927a5b65db1bd149fbe8f348fd670bda9",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",
    "requirements": "\u9700\u8981\u7528\u6237\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u586B\u5199\u81EA\u5DF1\u7684 Higgsfield \u8BBF\u95EE\u4EE4\u724C\uFF0C\u63D2\u4EF6\u4EC5\u5411\u58F0\u660E\u7684 Higgsfield \u670D\u52A1\u67E5\u8BE2\u751F\u6210\u8FDB\u5EA6\uFF1B\u7F51\u7AD9\u4E0D\u63A5\u6536\u4EE4\u724C\u3002"
  },
  {
    "id": "openpets.drag-vocab",
    "title": "\u62D6\u62FD\u8BCD\u6C47\u52A9\u624B",
    "description": "\u62D6\u5165\u8BCD\u6C47\u67E5\u770B\u7F51\u7EDC\u91CA\u4E49\u4E0E\u7FFB\u8BD1\uFF1B\u8FDE\u63A5 AnkiConnect \u540E\u53EF\u9009\u4FDD\u5B58\u5355\u8BCD\u5361\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u5B66\u4E60\u4E0E\u6548\u7387",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u8BCD",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.drag-vocab",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.drag-vocab.zip",
    "permissions": [
      "pet:speak",
      "pet:drop",
      "network",
      "events",
      "pet:reaction",
      "pet:interact",
      "network:local",
      "network:write"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u62D6\u5165\u6587\u672C",
      "\u7F51\u7EDC\u8BBF\u95EE",
      "\u4EA4\u4E92\u4E8B\u4EF6",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u4E92\u52A8\u6C14\u6CE1",
      "\u672C\u673A\u7F51\u7EDC",
      "\u7F51\u7EDC\u5199\u5165"
    ],
    "features": [
      "\u62D6\u5165\u8BCD\u6C47\u67E5\u770B\u7F51\u7EDC\u91CA\u4E49\u4E0E\u7FFB\u8BD1\uFF1B\u8FDE\u63A5 AnkiConnect \u540E\u53EF\u9009\u4FDD\u5B58\u5355\u8BCD\u5361\u3002",
      "\u91CA\u4E49\u4E0E\u7FFB\u8BD1\u9700\u8981\u7F51\u7EDC\u8BBF\u95EE\u3002\u4FDD\u5B58\u5355\u8BCD\u5230 Anki \u4E3A\u53EF\u9009\u64CD\u4F5C\uFF0C\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C Anki \u4E0E AnkiConnect\uFF0C\u5E76\u9009\u62E9\u5BF9\u5E94\u724C\u7EC4\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/community/openpets.drag-vocab",
    "sha256": "71356efce07269de28ac918c96320d6bbb558cdfd8f73176b91d2c16910ccad4",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",
    "requirements": "\u91CA\u4E49\u4E0E\u7FFB\u8BD1\u9700\u8981\u7F51\u7EDC\u8BBF\u95EE\u3002\u4FDD\u5B58\u5355\u8BCD\u5230 Anki \u4E3A\u53EF\u9009\u64CD\u4F5C\uFF0C\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C Anki \u4E0E AnkiConnect\uFF0C\u5E76\u9009\u62E9\u5BF9\u5E94\u724C\u7EC4\u3002"
  },
  {
    "id": "openpets.spotify-buddy",
    "title": "Spotify \u97F3\u4E50\u4F19\u4F34",
    "description": "\u914D\u7F6E Spotify \u5E94\u7528 ID \u5E76\u6388\u6743\u8D26\u53F7\u540E\uFF0C\u8BA9\u684C\u5BA0\u966A\u542C\u3001\u62A5\u544A\u66F2\u76EE\u4E0E\u63A7\u5236\u64AD\u653E\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u4E50",
    "version": "1.8.1",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.spotify-buddy",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.spotify-buddy.zip",
    "permissions": [
      "network",
      "network:write",
      "schedule",
      "storage",
      "pet:speak",
      "pet:reaction",
      "commands",
      "status",
      "auth",
      "secrets",
      "ui:toast"
    ],
    "permissionLabels": [
      "\u7F51\u7EDC\u8BBF\u95EE",
      "\u7F51\u7EDC\u5199\u5165",
      "\u5B9A\u65F6\u8C03\u5EA6",
      "\u63D2\u4EF6\u5B58\u6863",
      "\u684C\u5BA0\u53F0\u8BCD",
      "\u52A8\u4F5C\u53CD\u5E94",
      "\u4E3B\u52A8\u547D\u4EE4",
      "\u8FD0\u884C\u72B6\u6001",
      "\u5916\u90E8\u670D\u52A1\u6388\u6743",
      "\u672C\u673A\u79D8\u5BC6\u5B58\u50A8",
      "\u72B6\u6001\u63D0\u793A"
    ],
    "features": [
      "\u914D\u7F6E Spotify \u5E94\u7528 ID \u5E76\u6388\u6743\u8D26\u53F7\u540E\uFF0C\u8BA9\u684C\u5BA0\u966A\u542C\u3001\u62A5\u544A\u66F2\u76EE\u4E0E\u63A7\u5236\u64AD\u653E\u3002",
      "\u9700\u8981\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u63D0\u4F9B\u53EF\u7528\u7684 Spotify \u5E94\u7528 Client ID\uFF0C\u518D\u901A\u8FC7\u63D2\u4EF6\u547D\u4EE4\u5B8C\u6210\u8D26\u53F7\u6388\u6743\uFF1B\u5F53\u524D\u6E90\u7801\u4F7F\u7528\u5BBF\u4E3B OAuth\uFF0C\u4E0D\u8981\u6C42\u65E7 README \u4E2D\u7684 ngrok \u6865\u63A5\u3002\u64AD\u653E\u63A7\u5236\u8FD8\u53D7 Spotify \u8D26\u53F7\u548C\u670D\u52A1\u6743\u9650\u9650\u5236\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/community/openpets.spotify-buddy",
    "sha256": "74558f32294d028f20eb8de0993845eaf08bbb47ae60ee59b2b3288be5f99e4b",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",
    "requirements": "\u9700\u8981\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u63D0\u4F9B\u53EF\u7528\u7684 Spotify \u5E94\u7528 Client ID\uFF0C\u518D\u901A\u8FC7\u63D2\u4EF6\u547D\u4EE4\u5B8C\u6210\u8D26\u53F7\u6388\u6743\uFF1B\u5F53\u524D\u6E90\u7801\u4F7F\u7528\u5BBF\u4E3B OAuth\uFF0C\u4E0D\u8981\u6C42\u65E7 README \u4E2D\u7684 ngrok \u6865\u63A5\u3002\u64AD\u653E\u63A7\u5236\u8FD8\u53D7 Spotify \u8D26\u53F7\u548C\u670D\u52A1\u6743\u9650\u9650\u5236\u3002"
  },
  {
    "id": "openpets.walkabout",
    "title": "\u684C\u9762\u6F2B\u6B65",
    "description": "\u6279\u51C6\u79FB\u52A8\u6743\u9650\u540E\uFF0C\u8BA9\u684C\u5BA0\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002",
    "kind": "plugin",
    "pluginType": "sdk",
    "category": "\u751F\u6D3B\u966A\u4F34",
    "author": "Lykinzlj",
    "authorRole": "maintainer",
    "originalAuthor": "OpenPets contributors",
    "symbol": "\u6B65",
    "version": "1.0.0",
    "source": "https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.walkabout",
    "license": "MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",
    "download": "assets/openpets.walkabout.zip",
    "permissions": [
      "pet:move",
      "events",
      "pets:read",
      "status"
    ],
    "permissionLabels": [
      "\u684C\u5BA0\u79FB\u52A8",
      "\u4EA4\u4E92\u4E8B\u4EF6",
      "\u684C\u5BA0\u72B6\u6001",
      "\u8FD0\u884C\u72B6\u6001"
    ],
    "features": [
      "\u6279\u51C6\u79FB\u52A8\u6743\u9650\u540E\uFF0C\u8BA9\u684C\u5BA0\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002",
      "\u542F\u7528\u540E\u4F1A\u6309\u914D\u7F6E\u79FB\u52A8\u684C\u5BA0\uFF0C\u9700\u8981\u6279\u51C6\u684C\u5BA0\u79FB\u52A8\u6743\u9650\uFF1B\u53EF\u9009\u62E9\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002",
      "\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"
    ],
    "sourceFolder": "plugins/community/openpets.walkabout",
    "sha256": "6d5622f9eaf0906e591ca796b504157effe00c88c023286f7f38db2ab8d381de",
    "hostNotice": "\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",
    "requirements": "\u542F\u7528\u540E\u4F1A\u6309\u914D\u7F6E\u79FB\u52A8\u684C\u5BA0\uFF0C\u9700\u8981\u6279\u51C6\u684C\u5BA0\u79FB\u52A8\u6743\u9650\uFF1B\u53EF\u9009\u62E9\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002"
  }
];
`,type:"text/javascript; charset=utf-8"},"/community-data.js":{body:`import { pets } from './catalog.js';

// \u5408\u96C6\u53EA\u5F15\u7528\u5F53\u524D\u5E7F\u573A\u5B9E\u9645\u6536\u5F55\u7684\u4F5C\u54C1\uFF0C\u6570\u91CF\u7531\u9875\u9762\u6839\u636EpetIds\u8BA1\u7B97\u3002
const thumbnail = id => pets.find(pet => pet.id === id)?.thumbnail || 'assets/brand-logo.png';
export const collections = [
  {
    id: 'honkai-star-rail', title: '\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053', type: 'franchise',
    description: '\u4E0E\u661F\u7A79\u5217\u8F66\u540C\u884C\u3002\u5F53\u524D\u6536\u5F55\u6D41\u8424\u7684\u793E\u533A\u684C\u5BA0\u4F5C\u54C1\u3002',
    petIds: ['firefly--lingxiaotian'],
  },
  {
    id: 'genshin-impact', title: '\u539F\u795E', type: 'franchise',
    description: '\u8BA9\u63D0\u74E6\u7279\u7684\u4F19\u4F34\u6765\u5230\u684C\u9762\uFF0C\u6D4F\u89C8\u8299\u5B81\u5A1C\u3001\u6D3E\u8499\u4E0E\u516B\u91CD\u795E\u5B50\u7684\u52A8\u4F5C\u3002',
    petIds: ['furina--lingxiaotian', 'paimon--lingxiaotian', 'yae-miko--legeling'],
  },
  {
    id: 'animal-companions', title: '\u52A8\u7269\u4F19\u4F34', type: 'theme',
    description: '\u732B\u54AA\u3001\u67EF\u57FA\u4E0E\u5C0F\u718A\uFF0C\u4E00\u8D77\u7EC4\u6210\u8F7B\u677E\u6E29\u6696\u7684\u684C\u9762\u52A8\u7269\u56ED\u3002',
    petIds: ['hoodie-cat-openpets', 'bubu--gbn666', 'corgi-companion--cxian0928-afk', 'becky--natewanggg', 'jinmao--legeling'],
  },
  {
    id: 'anime-companions', title: '\u52A8\u6F2B\u4F19\u4F34', type: 'theme',
    description: '\u4ECE\u8299\u8389\u83B2\u5230\u521D\u97F3\u672A\u6765\uFF0C\u53D1\u73B0\u4E0D\u540C\u4F5C\u54C1\u4E2D\u7684\u53EF\u7231\u684C\u9762\u4F19\u4F34\u3002',
    petIds: ['frieren--lingxiaotian', 'miku--lingxiaotian', 'toothless--legeling', 'buttercup--legeling'],
  },
  {
    id: 'original-helpers', title: '\u539F\u521B\u5C0F\u52A9\u624B', type: 'theme',
    description: '\u6D4F\u89C8\u4F5C\u8005\u72EC\u7ACB\u521B\u4F5C\u7684\u89D2\u8272\uFF0C\u5BFB\u627E\u4E0E\u4F60\u5408\u62CD\u7684\u5C0F\u52A9\u624B\u3002',
    petIds: ['codexy--z19t', 'iris--yau-427', 'minty--somnusochi'],
  },
  {
    id: 'ai-inspired-companions', title: 'AI \u7075\u611F\u4F19\u4F34', type: 'theme',
    description: '\u53D7\u4E0D\u540C AI \u5F62\u8C61\u542F\u53D1\u7684\u793E\u533A\u4F5C\u54C1\uFF1B\u7D20\u6750\u53EF\u7528\u4E8E\u4F60\u9009\u62E9\u7684\u4EFB\u610F AI\u3002',
    petIds: ['claude--xiangking', 'deepseek-girl--legeling', 'codex-orb--legeling'],
  },
].map(collection => ({ ...collection, petIds: collection.petIds.filter(id => pets.some(pet => pet.id === id)) }));

// \u8FD9\u662F\u672C\u7AD9\u5236\u4F5C\u63D0\u6848\u793A\u4F8B\uFF0C\u501F\u5DF2\u6709\u4F5C\u54C1\u8BF4\u660E\u521B\u4F5C\u65B9\u5411\uFF0C\u4E0D\u662F\u4ED6\u4EBA\u516C\u5171\u6295\u7A3F\u6216\u5B9E\u65F6\u9700\u6C42\u5FEB\u7167\u3002
export const requestSeeds = [
  {
    id: 'example-reading-cat', title: '\u4F1A\u966A\u8BFB\u7684\u732B\u54AA',
    description: '\u672C\u7AD9\u521B\u4F5C\u63D0\u6848\u793A\u4F8B\uFF1A\u501F\u7528\u73B0\u6709\u591C\u732B\u4F5C\u4E3A\u9020\u578B\u53C2\u8003\uFF0C\u521B\u4F5C\u4E00\u53EA\u4F1A\u7FFB\u4E66\u3001\u6253\u76F9\u548C\u4F38\u61D2\u8170\u7684\u539F\u521B\u966A\u8BFB\u732B\u54AA\u3002\u53C2\u8003\u89D2\u8272\u4E0D\u662F\u5DF2\u7ECF\u5B8C\u6210\u7684\u65B0\u4F5C\u54C1\u3002',
    category: '\u52A8\u7269\u4F19\u4F34', version: 2, status: 'waiting',
    thumbnail: thumbnail('night-neko--netizenxuan'),
    source: '',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
  {
    id: 'example-starry-corgi', title: '\u661F\u7A7A\u67EF\u57FA',
    description: '\u672C\u7AD9\u521B\u4F5C\u63D0\u6848\u793A\u4F8B\uFF1A\u501F\u7528\u73B0\u6709 Corgi Companion \u4F5C\u4E3A\u9020\u578B\u53C2\u8003\uFF0C\u521B\u4F5C\u4E00\u53EA\u6234\u661F\u661F\u56F4\u5DFE\u3001\u5E26\u6765\u6E29\u548C\u4F11\u606F\u63D0\u9192\u7684\u539F\u521B\u67EF\u57FA\u3002',
    category: '\u52A8\u7269\u4F19\u4F34', version: 2, status: 'waiting',
    thumbnail: thumbnail('corgi-companion--cxian0928-afk'),
    source: 'https://github.com/legeling/awesome-codex-pet/tree/c617dd5d4c127a66ad65c8eb25c6f94412bed95c/pets/corgi-companion--cxian0928-afk',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
  {
    id: 'example-bubble-tea-robot', title: '\u6CE1\u6CE1\u8336\u673A\u5668\u4EBA',
    description: '\u672C\u7AD9\u521B\u4F5C\u63D0\u6848\u793A\u4F8B\uFF1A\u501F\u7528\u73B0\u6709 CRT \u663E\u793A\u5668\u4F5C\u4E3A\u9020\u578B\u53C2\u8003\uFF0C\u521B\u4F5C\u4E00\u53EA\u4F1A\u6CE1\u8336\u3001\u6325\u624B\u548C\u663E\u793A\u4E0D\u540C\u8868\u60C5\u7684\u539F\u521B\u5C0F\u673A\u5668\u4EBA\u3002',
    category: '\u673A\u5668\u4EBA', version: 2, status: 'waiting',
    thumbnail: thumbnail('crt-monitor--wxy'),
    source: 'https://github.com/legeling/awesome-codex-pet/tree/c617dd5d4c127a66ad65c8eb25c6f94412bed95c/pets/crt-monitor--wxy',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
  {
    id: 'example-focus-helper', title: '\u4E13\u6CE8\u5C0F\u52A9\u624B',
    description: '\u672C\u7AD9\u521B\u4F5C\u63D0\u6848\u793A\u4F8B\uFF1A\u501F\u7528\u73B0\u6709\u7801\u7075 Codexy \u4F5C\u4E3A\u9020\u578B\u53C2\u8003\uFF0C\u521B\u4F5C\u4E00\u4F4D\u966A\u4F34\u5199\u4F5C\u3001\u5DE5\u4F5C\u548C\u756A\u8304\u949F\u4F11\u606F\u7684\u539F\u521B\u5C0F\u52A9\u624B\uFF0C\u53EF\u63A5\u5165\u4EFB\u610F AI\u3002',
    category: '\u539F\u521B\u89D2\u8272', version: 2, status: 'waiting',
    thumbnail: thumbnail('codexy--z19t'),
    source: 'https://github.com/legeling/awesome-codex-pet/tree/c617dd5d4c127a66ad65c8eb25c6f94412bed95c/pets/codexy--z19t',
    updatedAt: '2026-10-07T00:00:00Z', example: true,
  },
];
`,type:"text/javascript; charset=utf-8"},"/community-core.js":{body:`export const requestCategories = ['\u6E38\u620F\u89D2\u8272', '\u52A8\u6F2B\u89D2\u8272', '\u5409\u7965\u7269', '\u5176\u4ED6', '\u673A\u5668\u4EBA', '\u539F\u521B\u89D2\u8272', '\u4EBA\u7269\u5934\u50CF', '\u52A8\u7269\u4F19\u4F34', '\u5E7B\u60F3\u751F\u7269', '\u7F51\u7EDC\u6897\u56FE', '\u7269\u4EF6\u4E0E\u9053\u5177'];
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
const maxLocalRequests = 100;

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value, label, limit, multiline = false) {
  if (typeof value !== 'string') throw new Error(\`\u8BF7\u586B\u5199\${label}\u3002\`);
  const result = value.replace(/\\r\\n?/g, '\\n').trim();
  const checked = multiline ? result.replace(/[\\n\\t]/g, '') : result;
  if (!result || result.length > limit || /[\\p{Cc}\\p{Cf}]/u.test(checked)) {
    throw new Error(\`\${label}\u9700\u4E3A 1 \u81F3 \${limit} \u5B57\u7684\u6709\u6548\u6587\u5B57\u3002\`);
  }
  return result;
}

export function validateRequest(input) {
  if (!record(input)) throw new Error('\u5236\u4F5C\u9700\u6C42\u683C\u5F0F\u65E0\u6548\u3002');
  const title = text(input.title, '\u89D2\u8272\u540D\u79F0', 80);
  const description = text(input.description, '\u521B\u4F5C\u8BF4\u660E', 1000, true);
  if (!requestCategories.includes(input.category)) throw new Error('\u8BF7\u9009\u62E9\u652F\u6301\u7684\u89D2\u8272\u5206\u7C7B\u3002');
  const version = input.version === 1 || input.version === '1' ? 1 : input.version === 2 || input.version === '2' ? 2 : null;
  if (version === null) throw new Error('\u8BF7\u9009\u62E9 V1 \u6216 V2 \u56FE\u96C6\u3002');
  return { title, description, category: input.category, version };
}

export function normalizeRequestState(input, seedIds) {
  const result = { entries: [], supported: [], following: [] };
  if (!record(input)) return result;
  const knownIds = new Set(Array.isArray(seedIds) ? seedIds.filter(id => typeof id === 'string') : []);
  const localIds = new Set();
  const entries = Array.isArray(input.entries) ? input.entries.slice(0, 200) : [];
  for (const entry of entries) {
    if (result.entries.length >= maxLocalRequests) break;
    if (!record(entry) || typeof entry.id !== 'string' || !/^local-[a-zA-Z0-9_-]{1,80}$/.test(entry.id) || localIds.has(entry.id)) continue;
    if (entry.status !== 'waiting' || typeof entry.createdAtISO !== 'string') continue;
    const createdAt = Date.parse(entry.createdAtISO);
    if (!Number.isFinite(createdAt) || new Date(createdAt).toISOString() !== entry.createdAtISO) continue;
    try {
      const validated = validateRequest(entry);
      result.entries.push({ id: entry.id, ...validated, status: 'waiting', createdAtISO: entry.createdAtISO });
      localIds.add(entry.id);
      knownIds.add(entry.id);
    } catch {
      // \u5355\u6761\u635F\u574F\u8BB0\u5F55\u4E0D\u963B\u6B62\u5176\u4ED6\u6709\u6548\u9700\u6C42\u6062\u590D\u3002
    }
  }
  for (const key of ['supported', 'following']) {
    const ids = Array.isArray(input[key]) ? input[key].slice(0, 200) : [];
    result[key] = [...new Set(ids.filter(id => typeof id === 'string' && knownIds.has(id)))];
  }
  return result;
}

export function rankPets(pets, activity, period, now = Date.now()) {
  const timestamp = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(timestamp) || !Array.isArray(pets)) return [];
  const since = timestamp - weekMilliseconds;
  const ranked = [];
  for (const work of pets) {
    const entry = record(activity) && Object.hasOwn(activity, work.id) ? activity[work.id] : undefined;
    if (!record(entry)) continue;
    const downloads = Number.isSafeInteger(entry.downloads) && entry.downloads >= 0 ? entry.downloads : 0;
    const count = entry.scope === 'site' ? period === 'week' ? entry.weekly : downloads + entry.likes : period === 'week'
      ? (Array.isArray(entry.recent) ? entry.recent.filter(time => Number.isFinite(time) && time > since && time <= timestamp).length : 0)
      : downloads + Number(entry.liked === true);
    if (count > 0) ranked.push({ work, count });
  }
  return ranked.sort((a, b) => b.count - a.count || a.work.title.localeCompare(b.work.title, 'zh-CN'));
}

export function rankAuthors(pets) {
  const authors = new Map();
  for (const pet of pets) {
    if (!pet.author || !pet.id) continue;
    const entry = authors.get(pet.author) || { name: pet.author, count: 0, petIds: [] };
    if (!entry.petIds.includes(pet.id)) {
      entry.petIds.push(pet.id);
      entry.count++;
    }
    authors.set(pet.author, entry);
  }
  return [...authors.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function collectionWorks(collection, pets) {
  if (!record(collection) || !Array.isArray(collection.petIds)) return [];
  const byId = new Map(pets.map(pet => [pet.id, pet]));
  return [...new Set(collection.petIds)].map(id => byId.get(id)).filter(Boolean);
}

export function contributorHref(author, kind = 'pets') {
  return \`#contributors/\${kind === 'plugins' ? 'plugins' : 'pets'}/\${encodeURIComponent(author)}\`;
}

export function workStatistics(works, activity, available = true, now = Date.now()) {
  const members = [...new Map(works.filter(work => work?.id).map(work => [work.id, work])).values()];
  const result = { works: members.length, downloads: available ? 0 : null, likes: available ? 0 : null, weekly: available ? 0 : null };
  if (!available) return result;
  for (const work of members) {
    const entry = activity?.[work.id];
    if (!record(entry)) continue;
    result.downloads += Number.isSafeInteger(entry.downloads) && entry.downloads >= 0 ? entry.downloads : 0;
    result.likes += entry.scope === 'site' ? Number.isSafeInteger(entry.likes) && entry.likes >= 0 ? entry.likes : 0 : Number(entry.liked === true);
    result.weekly += entry.scope === 'site' ? Number.isSafeInteger(entry.weekly) && entry.weekly >= 0 ? entry.weekly : 0 : (Array.isArray(entry.recent) ? entry.recent.filter(time => Number.isFinite(time) && time > now - weekMilliseconds && time <= now).length : 0);
  }
  return result;
}

export function contributorRankingStatistics(works, activity, available = true) {
  const members = [...new Map(works.filter(work => work?.id).map(work => [work.id, work])).values()];
  const result = workStatistics(members, activity, available);
  for (const key of ['weeklyDownloads', 'weeklyLikes']) {
    result[key] = available && members.every(work => activity?.[work.id]?.scope === 'site' && Number.isSafeInteger(activity[work.id][key]) && activity[work.id][key] >= 0) ? members.reduce((sum, work) => sum + activity[work.id][key], 0) : null;
  }
  return result;
}

export function contributorProfile(works, author, kind, activity, available = true) {
  const all = [...new Map(works.filter(work => work.author === author).map(work => [work.id, work])).values()];
  if (!all.length) return null;
  const members = all.filter(work => work.kind === (kind === 'plugins' ? 'plugin' : 'pet'));
  const identified = all.find(work => typeof work.authorHandle === 'string' && work.authorHandle.trim());
  let homepage = null;
  for (const work of all) {
    try { const url = new URL(work.authorUrl); if (url.protocol === 'https:' && !url.username && !url.password) { homepage = url.href; break; } } catch { /* \u672A\u63D0\u4F9B\u660E\u786E\u4F5C\u8005\u4E3B\u9875\uFF0C\u4E0D\u731C\u5730\u5740\u3002 */ }
  }
  return { name: author, handle: identified?.authorHandle || '', homepage, members, allCount: all.length, petCount: all.filter(work => work.kind === 'pet').length, pluginCount: all.filter(work => work.kind === 'plugin').length, statistics: workStatistics(members, activity, available) };
}
`,type:"text/javascript; charset=utf-8"},"/community-pages.js":{body:`import { collections, requestSeeds } from './community-data.js';
import { validateRequest, normalizeRequestState, rankPets, rankAuthors, collectionWorks, contributorHref, contributorProfile, workStatistics, contributorRankingStatistics } from './community-core.js';
import { petDisplayAuthor } from './catalog.js';
import { githubSubmissionUrl } from './publication-client.js';

export function createCommunityPages({ pets, plugins, activityFor, escapeHtml, icon, toast, copyGalleryText, download, browseGallery, publication, session, renderCard, statisticsSnapshot, refreshStatistics, submissionRepository }) {
  const $ = selector => document.querySelector(selector);
  const stateKey = 'pet-community-requests-v1';
  const seedIds = requestSeeds.map(item => item.id);
  let requestsSaved = true;
  let requestState;
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey) ?? '{}');
    const publicIds = [...(Array.isArray(saved.supported) ? saved.supported : []), ...(Array.isArray(saved.following) ? saved.following : [])].filter(id => typeof id === 'string' && /^request-[a-f0-9-]{36}$/.test(id));
    requestState = normalizeRequestState(saved, [...seedIds, ...publicIds]);
  } catch {
    requestsSaved = false;
    requestState = normalizeRequestState({}, seedIds);
  }
  let collectionOffset = 0;
  let rankingTab = 'pets';
  let collectionFilter = 'all';
  let currentRoute = 'pets';
  let currentId;
  let currentAuthor;
  let contributorGeneration = 0;
  let contributorState = null;
  let contributorPending = false;
  let contributorIdentity = null;
  let publicRequests = [];
  let requestPublishing = false;

  function saveRequests() {
    try {
      localStorage.setItem(stateKey, JSON.stringify(requestState));
      requestsSaved = true;
    } catch {
      requestsSaved = false;
      toast('\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u4FDD\u5B58\uFF0C\u5236\u4F5C\u9700\u6C42\u4E0E\u5173\u6CE8\u4EC5\u5728\u5F53\u524D\u9875\u9762\u4FDD\u7559\u3002');
    }
  }

  function petRanking(period, entries = pets) {
    return rankPets(entries, Object.fromEntries(entries.map(work => [work.id, activityFor(work.id)])), period, Date.now());
  }

  function rankingRows(entries, kind, period = 'week') {
    if (!entries.length) return '<li class="community-empty">\u8FD8\u6CA1\u6709\u4E92\u52A8\u8BB0\u5F55\u3002\u53BB\u5E7F\u573A\u4E3A\u559C\u6B22\u7684\u4F19\u4F34\u70B9\u8D5E\u6216\u4E0B\u8F7D\uFF0C\u5B83\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</li>';
    return entries.map((entry, index) => {
      const plugin = kind === 'plugins' || kind === 'plugin-authors';
      const author = kind === 'authors' || kind === 'plugin-authors';
      const entries = plugin ? plugins : pets;
      const work = author ? entries.find(item => item.id === entry.petIds[0]) : entry.work;
      const href = author ? contributorHref(entry.name, plugin ? 'plugins' : 'pets') : \`#\${plugin ? 'plugins' : 'pets'}/\${work.id}\`;
      const label = author ? plugin ? entry.name : petDisplayAuthor(work) : work.title;
      const metric = author ? \`\${entry.count} \${plugin ? '\u4E2A\u63D2\u4EF6' : '\u53EA\u5BA0\u7269'}\` : \`\${period === 'week' ? '\u8FD1 7 \u65E5' : '\u7D2F\u8BA1'} \${entry.count}\`;
      const cover = work.cover || work.presentation?.cover;
      const visual = plugin ? cover ? \`<img src="\${escapeHtml(cover)}" alt="" width="48" height="52">\` : \`<span class="community-rank-symbol" aria-hidden="true">\${escapeHtml(work.symbol || '\u2727')}</span>\` : \`<img class="\${author ? 'community-author-avatar' : ''}" src="\${escapeHtml(work.thumbnail)}" alt="" width="48" height="52">\`;
      return \`<li class="community-ranking-row"><span class="community-rank-position">\${index + 1}</span><a class="community-rank-work" href="\${escapeHtml(href)}">\${visual}<span>\${escapeHtml(label)}</span></a><span class="community-rank-value">\${metric}</span></li>\`;
    }).join('');
  }

  function collectionCard(item) {
    const members = collectionWorks(item, pets);
    return \`<article class="community-collection-card"><a class="community-collection-visual" href="#collections/\${item.id}" aria-label="\u6D4F\u89C8 \${escapeHtml(item.title)}">\${members.slice(0, 5).map(work => \`<img src="\${escapeHtml(work.thumbnail)}" alt="\${escapeHtml(work.title)}" loading="lazy" width="192" height="208">\`).join('')}</a><button type="button" class="community-collection-share" data-share-collection="\${item.id}" aria-label="\u5206\u4EAB \${escapeHtml(item.title)}">\${icon('share')}</button><div class="community-collection-body"><p class="community-collection-kind">\${item.type === 'franchise' ? '\u4F5C\u54C1\u7CFB\u5217' : '\u4E3B\u9898\u7CFB\u5217'}</p><div class="community-collection-title-row"><h3><a href="#collections/\${item.id}">\${escapeHtml(item.title)}</a></h3><span>\${members.length} \u53EA\u5BA0\u7269</span></div><p class="community-collection-description">\${escapeHtml(item.description)}</p></div></article>\`;
  }

  function allRequests() {
    return [...publicRequests, ...requestState.entries.slice().reverse(), ...requestSeeds];
  }

  function requestCard(item) {
    const supported = requestState.supported.includes(item.id);
    const following = requestState.following.includes(item.id);
    const local = item.id.startsWith('local-');
    const image = item.thumbnail ? \`<img src="\${escapeHtml(item.thumbnail)}" alt="\u53C2\u8003\u5916\u89C2" loading="lazy" width="192" height="208">\` : '<span aria-hidden="true">\u2727</span><small>\u4F60\u7684\u89D2\u8272\u521B\u610F</small>';
    const date = item.createdAtISO || item.updatedAt;
    const reference = local ? '\u6211\u7684\u5236\u4F5C\u9700\u6C42' : item.public ? '\u793E\u533A\u5236\u4F5C\u9700\u6C42' : '\u521B\u4F5C\u63D0\u6848\u793A\u4F8B';
    return \`<article class="community-request-card" id="request-\${item.id}"><div class="community-request-visual">\${image}</div><div class="community-request-body"><div class="community-request-meta"><span>\u5F85\u5236\u4F5C</span><small>\${escapeHtml(item.category)} \xB7 V\${item.version}</small></div><h3 class="community-request-title">\${escapeHtml(item.title)}</h3><p class="community-request-description">\${escapeHtml(item.description)}</p><div class="community-request-footnote"><span>\${reference}</span><span>\${date ? escapeHtml(String(date).slice(0, 10)) : '\u7B49\u4F60\u5F00\u59CB'}</span></div><div class="community-request-actions"><button class="primary" type="button" data-request-support="\${item.id}" aria-pressed="\${supported}">\${icon('heart')} \${supported ? '\u5DF2\u652F\u6301' : '\u6211\u4E5F\u60F3\u8981'} <span>\${supported ? 1 : 0}</span></button><button class="secondary" type="button" data-request-follow="\${item.id}" aria-pressed="\${following}">\${following ? '\u5DF2\u5173\u6CE8' : '\u5173\u6CE8\u8FDB\u5EA6'}</button></div></div></article>\`;
  }

  function renderHome() {
    $('#home-pet-count').textContent = pets.length;
    $('#home-collected-count').textContent = \`\u5DF2\u6536\u5F55 \${pets.length} \u53EA\u7CBE\u54C1\u5BA0\u7269\`;
    $('#home-category-count').textContent = new Set(pets.map(item => item.category)).size;
    const featured = pets.slice(0, 6);
    $('#hero-pets').innerHTML = featured.map(work => \`<a class="home-pet-card" href="#pets/\${work.id}"><img src="\${escapeHtml(work.thumbnail)}" alt="\${escapeHtml(work.title)}" width="192" height="208"><span>\${escapeHtml(work.title)}</span></a>\`).join('');
    $('#home-pet-ranking').innerHTML = rankingRows(petRanking('week').slice(0, 5), 'pets');
    $('#home-author-ranking').innerHTML = rankingRows(rankAuthors(pets).slice(0, 5), 'authors');
    $('#request-preview').innerHTML = allRequests().slice(0, 4).map(requestCard).join('');
    $('#collection-preview').innerHTML = Array.from({ length: Math.min(3, collections.length) }, (_, index) => collectionCard(collections[(collectionOffset + index) % collections.length])).join('');
  }

  function rankingSelection() {
    return { kind: rankingTab.startsWith('plugin') ? 'plugins' : 'pets', view: rankingTab.includes('authors') ? 'authors' : rankingTab.includes('collections') ? 'collections' : 'works' };
  }

  function rankingRoute(kind, view) {
    return view === 'works' ? kind : view === 'authors' ? kind === 'plugins' ? 'plugin-authors' : 'authors' : kind === 'plugins' ? 'plugin-collections' : 'collections';
  }

  function activityMap(entries) {
    return Object.fromEntries(entries.map(work => [work.id, activityFor(work.id)]));
  }

  function rankVisual(members, kind) {
    return \`<span class="ranking-mosaic \${kind === 'plugins' ? 'ranking-plugin-mosaic' : ''}">\${members.slice(0, 4).map(work => {
      const cover = kind === 'plugins' ? work.cover || work.presentation?.cover : work.thumbnail;
      return cover ? \`<img src="\${escapeHtml(cover)}" alt="" loading="lazy" width="72" height="78">\` : \`<span aria-hidden="true">\${escapeHtml(work.symbol || '\u2726')}</span>\`;
    }).join('')}</span>\`;
  }

  function rankLongRow(item, index, kind, period, available) {
    const metric = value => value === null || value === undefined ? '\u2014' : value.toLocaleString('zh-CN');
    const stats = item.statistics;
    const identity = \`<span class="ranking-identity"><strong>\${escapeHtml(item.title)}</strong>\${item.handle ? \`<span class="ranking-handle">@\${escapeHtml(item.handle.replace(/^@/, ''))}</span>\` : ''}<small>\${escapeHtml(item.subtitle)}</small></span>\`;
    const columns = item.contributor ? [[period === 'week' ? stats.weeklyDownloads : stats.downloads, period === 'week' ? '\u8FD1 7 \u65E5\u4E0B\u8F7D' : '\u4E0B\u8F7D'], [period === 'week' ? stats.weeklyLikes : stats.likes, period === 'week' ? '\u8FD1 7 \u65E5\u70B9\u8D5E' : '\u70B9\u8D5E'], [item.followers, '\u5173\u6CE8\u8005']] : [[available ? period === 'week' ? stats.weekly : stats.downloads + stats.likes : null, period === 'week' ? '\u8FD1 7 \u65E5\u4E92\u52A8' : '\u7D2F\u8BA1\u4E92\u52A8'], [stats.downloads, '\u4E0B\u8F7D'], [stats.likes, '\u70B9\u8D5E']];
    return \`<li class="community-ranking-row ranking-long-row"><span class="community-rank-position">\${String(index + 1).padStart(2, '0')}</span><a class="ranking-entry" href="\${escapeHtml(item.href)}"\${item.category ? \` data-ranking-category="\${escapeHtml(item.category)}"\` : ''}>\${rankVisual(item.members, kind)}\${identity}</a><dl class="ranking-metrics">\${columns.map(([value, label]) => \`<div><dd>\${metric(value)}</dd><dt>\${label}</dt></div>\`).join('')}</dl></li>\`;
  }

  function renderRankings() {
    const { kind, view } = rankingSelection(), period = $('#ranking-period').value;
    const entries = kind === 'plugins' ? plugins : pets;
    const snapshot = statisticsSnapshot(), activity = activityMap(entries);
    $('#ranking-kinds').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rankingKind === kind)));
    $('#ranking-tabs').querySelectorAll('button').forEach(button => { const selected = button.dataset.rankingView === view; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
    $('#ranking-period-buttons').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rankingPeriod === period)));
    $('#ranking-scope').textContent = \`\${kind === 'plugins' ? '\u63D2\u4EF6' : '\u684C\u5BA0'} \xB7 \${snapshot.scope === 'site' ? '\u5168\u7AD9\u771F\u5B9E\u4E92\u52A8' : '\u6B64\u6D4F\u89C8\u5668\u8BB0\u5F55'}\${snapshot.available ? \` \xB7 \${period === 'week' ? '\u8FD1 7 \u65E5' : '\u7D2F\u8BA1'}\u4E92\u52A8\u6392\u5E8F\` : ' \xB7 \u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528'}\`;
    const timestamp = new Date(snapshot.updatedAt);
    $('#ranking-snapshot').textContent = snapshot.available && Number.isFinite(timestamp.getTime()) ? timestamp.toLocaleString('zh-CN', { hour12: false }) : '\u2014';
    $('#ranking-refresh').textContent = '\u6253\u5F00\u9875\u9762\u4E0E\u4E92\u52A8\u540E\u8BFB\u53D6';
    let rows;
    if (view === 'authors') {
      rows = rankAuthors(entries).map(author => {
        const profile = contributorProfile([...pets, ...plugins], author.name, kind, activity, snapshot.available);
        return { title: author.name, handle: profile.handle, subtitle: \`\u672C\u7AD9\u8D21\u732E \${profile.members.length} \${kind === 'plugins' ? '\u4E2A\u63D2\u4EF6' : '\u53EA\u684C\u5BA0'}\`, members: profile.members, href: contributorHref(author.name, kind), contributor: true, followers: snapshot.contributors?.get(author.name) ?? null, statistics: contributorRankingStatistics(profile.members, activity, snapshot.available) };
      });
    } else if (view === 'collections') {
      rows = kind === 'pets' ? collections.map(item => ({ title: item.title, members: collectionWorks(item, pets), href: \`#collections/\${item.id}\` })) : [...new Set(plugins.map(work => work.category))].map(category => ({ title: category, members: plugins.filter(work => work.category === category), href: '#plugins', category }));
      rows = rows.filter(item => item.members.length).map(item => ({ ...item, subtitle: \`\${item.members.length} \${kind === 'plugins' ? '\u4E2A\u63D2\u4EF6' : '\u53EA\u684C\u5BA0'}\`, statistics: workStatistics(item.members, activity, snapshot.available) }));
    } else {
      rows = snapshot.available ? petRanking(period, entries).map(entry => ({ title: entry.work.title, members: [entry.work], href: \`#\${kind}/\${entry.work.id}\`, handle: entry.work.authorHandle, subtitle: \`\u4F5C\u8005 \${entry.work.author}\`, statistics: workStatistics([entry.work], activity) })) : [];
    }
    if (view !== 'works' && snapshot.available) rows.sort((a, b) => (period === 'week' ? b.statistics.weekly - a.statistics.weekly : b.statistics.downloads + b.statistics.likes - a.statistics.downloads - a.statistics.likes) || b.members.length - a.members.length || a.title.localeCompare(b.title, 'zh-CN'));
    $('#ranking-list').innerHTML = rows.length ? rows.map((item, index) => rankLongRow(item, index, kind, period, snapshot.available)).join('') : \`<li class="community-empty">\${snapshot.available ? '\u8FD8\u6CA1\u6709\u4E92\u52A8\u8BB0\u5F55\u3002\u4E3A\u559C\u6B22\u7684\u4F5C\u54C1\u70B9\u8D5E\u6216\u4E0B\u8F7D\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u5B9E\u9645\u6392\u540D\u3002' : '\u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u5237\u65B0\u3002'}</li>\`;
  }

  function displayContributorState() {
    const available = contributorState?.available === true;
    $('#contributor-followers').textContent = available ? contributorState.followers.toLocaleString('zh-CN') : '\u2014';
    $('#contributor-follow').disabled = !available || contributorPending;
    $('#contributor-follow').setAttribute('aria-pressed', String(available && contributorState.following));
    $('#contributor-follow').textContent = contributorPending ? '\u6B63\u5728\u4FDD\u5B58\u2026' : available && contributorState.following ? '\u5DF2\u5173\u6CE8' : '\u5173\u6CE8';
    $('#contributor-follow-status').textContent = contributorPending ? '\u6B63\u5728\u8BFB\u53D6\u5173\u6CE8\u72B6\u6001\u2026' : contributorState?.error || (available ? '' : '\u5173\u6CE8\u670D\u52A1\u6682\u4E0D\u53EF\u7528\u3002');
  }

  function renderContributor(kind, encodedAuthor) {
    kind = kind === 'plugins' ? 'plugins' : 'pets';
    let author;
    try { author = decodeURIComponent(encodedAuthor || ''); } catch { author = ''; }
    const snapshot = statisticsSnapshot();
    const profile = contributorProfile([...pets, ...plugins], author, kind, activityMap([...pets, ...plugins]), snapshot.available);
    $('#contributor-back').href = \`#rankings/\${kind === 'plugins' ? 'plugin-authors' : 'authors'}\`;
    $('#contributor-name').textContent = profile?.name || '\u672A\u627E\u5230\u6B64\u521B\u4F5C\u8005';
    $('#contributor-handle').textContent = profile?.handle ? \`@\${profile.handle.replace(/^@/, '')}\` : '';
    $('#contributor-description').textContent = profile ? \`\u672C\u7AD9\u8D21\u732E \${profile.allCount} \u4EF6\u4F5C\u54C1\` : '\u8BF7\u4ECE\u672C\u7AD9\u699C\u5355\u9009\u62E9\u4E00\u4F4D\u521B\u4F5C\u8005\u3002';
    $('#contributor-work-count').textContent = profile?.members.length ?? '\u2014';
    $('#contributor-downloads').textContent = profile?.statistics.downloads?.toLocaleString('zh-CN') ?? '\u2014';
    $('#contributor-likes').textContent = profile?.statistics.likes?.toLocaleString('zh-CN') ?? '\u2014';
    $('#contributor-homepage').hidden = !profile?.homepage;
    $('#contributor-homepage-unavailable').hidden = Boolean(profile?.homepage);
    if (profile?.homepage) $('#contributor-homepage').href = profile.homepage; else $('#contributor-homepage').removeAttribute('href');
    $('#contributor-homepage-unavailable').title = '\u4F5C\u8005\u672A\u63D0\u4F9B\u4E3B\u9875';
    $('#contributor-works-title').textContent = profile ? \`\${profile.name} \u7684\${kind === 'plugins' ? '\u63D2\u4EF6' : '\u684C\u5BA0'}\` : '\u521B\u4F5C\u8005\u7684\u4F5C\u54C1';
    $('#contributor-kind-tabs').innerHTML = profile ? \`<a class="button \${kind === 'pets' ? 'primary' : 'secondary'}" href="\${escapeHtml(contributorHref(author, 'pets'))}" aria-current="\${kind === 'pets' ? 'page' : 'false'}">\u684C\u5BA0 \${profile.petCount}</a><a class="button \${kind === 'plugins' ? 'primary' : 'secondary'}" href="\${escapeHtml(contributorHref(author, 'plugins'))}" aria-current="\${kind === 'plugins' ? 'page' : 'false'}">\u63D2\u4EF6 \${profile.pluginCount}</a>\` : '';
    $('#contributor-statistics-scope').textContent = \`\${snapshot.scope === 'site' ? '\u5168\u7AD9' : '\u6B64\u6D4F\u89C8\u5668'}\${snapshot.available ? '\u4E0B\u8F7D\u4E0E\u70B9\u8D5E' : '\u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528'} \xB7 \u5F53\u524D\u4F5C\u54C1\u7C7B\u578B \xB7 \u4E0B\u8F7D\u4E0D\u4EE3\u8868\u5B89\u88C5\u6210\u529F\`;
    $('#contributor-works').innerHTML = profile?.members.length ? profile.members.map(work => renderCard(work)).join('') : '<p class="community-empty">\u672C\u7AD9\u6682\u65E0\u6B64\u7C7B\u578B\u4F5C\u54C1\u3002</p>';
    const usable = Boolean(session()?.interactionsAvailable || session()?.available);
    const key = \`\${kind}/\${author}/\${usable}\`;
    if (contributorIdentity?.key === key) { displayContributorState(); return; }
    const generation = ++contributorGeneration;
    contributorIdentity = { key, author, kind };
    contributorState = null;
    contributorPending = Boolean(profile && usable);
    displayContributorState();
    if (!contributorPending) return;
    void publication.contributor(author, kind).then(state => {
      if (generation === contributorGeneration) contributorState = state;
    }).catch(error => {
      if (generation === contributorGeneration) contributorState = { available: false, error: error.message };
    }).finally(() => {
      if (generation === contributorGeneration) { contributorPending = false; displayContributorState(); }
    });
  }

  function renderPluginRankings() {
    $('#home-plugin-ranking').innerHTML = rankingRows(petRanking('week', plugins).slice(0, 5), 'plugins');
    $('#home-plugin-author-ranking').innerHTML = rankingRows(rankAuthors(plugins).slice(0, 5), 'plugin-authors');
  }

  function renderCollections(id) {
    const item = collections.find(entry => entry.id === id);
    $('#collection-detail').hidden = !item;
    $('#collection-list').hidden = Boolean(item);
    $('.community-collection-toolbar').hidden = Boolean(item);
    if (item) {
      $('#collection-detail-title').textContent = item.title;
      $('#collection-detail-description').textContent = item.description;
      $('#collection-pets').innerHTML = collectionWorks(item, pets).map(work => \`<article class="work-card"><div class="card-stage"><a class="card-preview" href="#pets/\${work.id}"><img src="\${escapeHtml(work.thumbnail)}" alt="\${escapeHtml(work.title)}" width="192" height="208"></a></div><div class="card-body"><h2><a href="#pets/\${work.id}">\${escapeHtml(work.title)}</a></h2><p class="byline">\u4F5C\u8005 \${escapeHtml(petDisplayAuthor(work))}</p><div class="card-actions"><a class="button secondary" href="#pets/\${work.id}">\u9884\u89C8\u52A8\u4F5C</a><a class="button primary" href="\${escapeHtml(work.download)}" download data-download="\${work.id}">\u4E0B\u8F7D ZIP</a></div></div></article>\`).join('');
    } else {
      const query = $('#collection-search').value.trim().toLocaleLowerCase();
      const matches = collections.filter(entry => (collectionFilter === 'all' || entry.type === collectionFilter) && \`\${entry.title} \${entry.description} \${collectionWorks(entry, pets).map(work => work.title).join(' ')}\`.toLocaleLowerCase().includes(query));
      $('#collection-list').innerHTML = matches.length ? matches.map(collectionCard).join('') : '<p class="community-empty">\u6CA1\u6709\u5339\u914D\u7684\u5408\u96C6\uFF0C\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002</p>';
      $('#collection-filter').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collectionFilter === collectionFilter)));
      if (id) toast('\u6B64\u5408\u96C6\u4E0D\u5B58\u5728\uFF0C\u8BF7\u4ECE\u5217\u8868\u91CD\u65B0\u9009\u62E9\u3002');
    }
  }

  function renderRequests() {
    const query = $('#request-search').value.trim().toLocaleLowerCase();
    const followingOnly = $('#request-state').value === 'following';
    const matches = allRequests().filter(item => (!followingOnly || requestState.following.includes(item.id)) && \`\${item.title} \${item.description} \${item.category}\`.toLocaleLowerCase().includes(query));
    $('#request-list').innerHTML = matches.length ? matches.map(requestCard).join('') : '<p class="community-empty">\u6682\u65F6\u6CA1\u6709\u5339\u914D\u7684\u5236\u4F5C\u9700\u6C42\u3002\u5199\u4E0B\u4F60\u7684\u89D2\u8272\u60F3\u6CD5\uFF0C\u6216\u5173\u6CE8\u4E00\u9879\u63D0\u6848\u3002</p>';
  }

  function render(route, id, author) {
    currentRoute = route;
    currentId = id;
    currentAuthor = author;
    if (route === 'pets') renderHome();
    if (route === 'plugins') renderPluginRankings();
    if (route === 'rankings') { if (['pets', 'plugins', 'authors', 'plugin-authors', 'collections', 'plugin-collections'].includes(id)) rankingTab = id; renderRankings(); }
    if (route === 'contributors') renderContributor(id, author);
    if (route === 'collections') renderCollections(id);
    if (route === 'requests') renderRequests();
  }

  for (const [selector, step] of [['#collection-prev', -1], ['#collection-next', 1]]) {
    $(selector).addEventListener('click', () => {
      collectionOffset = (collectionOffset + step + collections.length) % collections.length;
      renderHome();
    });
  }
  $('#ranking-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-ranking-view]');
    if (button) { rankingTab = rankingRoute(rankingSelection().kind, button.dataset.rankingView); location.hash = \`rankings/\${rankingTab}\`; renderRankings(); }
  });
  $('#ranking-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = ['works', 'authors', 'collections'], selection = rankingSelection();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabs.indexOf(selection.view) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    rankingTab = rankingRoute(selection.kind, tabs[index]);
    location.hash = \`rankings/\${rankingTab}\`;
    renderRankings();
    $(\`#ranking-tabs [data-ranking-view="\${tabs[index]}"]\`).focus();
  });
  $('#ranking-kinds').addEventListener('click', event => {
    const button = event.target.closest('[data-ranking-kind]');
    if (button) { rankingTab = rankingRoute(button.dataset.rankingKind, rankingSelection().view); location.hash = \`rankings/\${rankingTab}\`; renderRankings(); }
  });
  $('#ranking-period-buttons').addEventListener('click', event => {
    const button = event.target.closest('[data-ranking-period]');
    if (button) { $('#ranking-period').value = button.dataset.rankingPeriod; renderRankings(); }
  });
  $('#ranking-period').addEventListener('change', renderRankings);
  $('#contributor-follow').addEventListener('click', async () => {
    if (contributorPending || contributorState?.available !== true || !contributorIdentity) return;
    const generation = contributorGeneration, { author, kind } = contributorIdentity;
    const following = !contributorState.following;
    contributorPending = true; displayContributorState();
    try {
      const state = await publication.followContributor(author, kind, following);
      if (generation === contributorGeneration) { contributorState = state; await refreshStatistics?.(); }
    } catch (error) {
      if (generation === contributorGeneration) { contributorState = { ...contributorState, error: error.message }; toast(error.message); }
    } finally { if (generation === contributorGeneration) { contributorPending = false; displayContributorState(); } }
  });
  $('#collection-search').addEventListener('input', () => renderCollections());
  $('#collection-filter').addEventListener('click', event => {
    const button = event.target.closest('[data-collection-filter]');
    if (button) { collectionFilter = button.dataset.collectionFilter; renderCollections(); }
  });
  $('#request-search').addEventListener('input', renderRequests);
  $('#request-state').addEventListener('change', renderRequests);
  $('#request-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (requestPublishing) return;
    const form = event.currentTarget;
    const submissionLink = $('#request-submission-link');
    submissionLink.hidden = true; submissionLink.removeAttribute('href');
    try {
      const input = validateRequest(Object.fromEntries(new FormData(form)));
      const existing = requestState.entries.find(item => item.title === input.title && item.description === input.description && item.category === input.category && item.version === input.version);
      if (!existing) {
        if (requestState.entries.length >= 100) throw new Error('\u5DF2\u4FDD\u5B58 100 \u9879\u9700\u6C42\uFF0C\u8BF7\u5148\u5BFC\u51FA\u5DF2\u6709\u9700\u6C42\u3002');
        requestState.entries.push({ ...input, id: \`local-\${crypto.randomUUID()}\`, status: 'waiting', createdAtISO: new Date().toISOString() });
      }
      saveRequests();
      if (event.submitter?.id === 'request-publish') {
        requestPublishing = true; $('#request-publish').disabled = true;
        const repository = submissionRepository?.();
        if (repository) {
          const href = githubSubmissionUrl(repository, { ...input, workflow: 'request' });
          const link = $('#request-submission-link'); link.href = href; link.hidden = false;
          window.open(href, '_blank', 'noopener,noreferrer');
          $('#request-feedback').textContent = \`\${requestsSaved ? '\u9700\u6C42\u8349\u7A3F\u5DF2\u4FDD\u5B58\u3002' : '\u9700\u6C42\u4FDD\u7559\u5728\u5F53\u524D\u9875\u9762\uFF0C\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u6301\u4E45\u4FDD\u5B58\u3002'}\u8BF7\u5728\u672C\u7AD9 GitHub \u6295\u7A3F\u8868\u5355\u63D0\u4EA4\uFF0C\u5904\u7406\u6536\u5F55\u540E\u624D\u4F1A\u5728\u7F51\u7AD9\u663E\u793A\uFF1B\u4E5F\u53EF\u70B9\u51FB\u4E0B\u65B9\u94FE\u63A5\u6253\u5F00\u8868\u5355\u3002\`;
          renderRequests(); return;
        }
        const identity = await publication.session();
        if (!identity.available) throw new Error('\u672C\u673A\u9875\u9762\u4E0D\u63D0\u4F9B\u516C\u5171\u6295\u7A3F\uFF0C\u8349\u7A3F\u5DF2\u4FDD\u5B58\u3002\u8BF7\u5230\u516C\u5F00\u5171\u521B\u5E73\u53F0\u53D1\u5E03\u3002');
        if (!identity.signedIn) throw new Error('\u8349\u7A3F\u5DF2\u4FDD\u5B58\uFF0C\u6295\u7A3F\u5165\u53E3\u5C1A\u672A\u5F00\u653E\u3002');
        const item = await publication.publishRequest(input);
        publicRequests = [item, ...publicRequests.filter(request => request.id !== item.id)];
        $('#request-feedback').textContent = '\u5236\u4F5C\u9700\u6C42\u5DF2\u53D1\u5E03\u5230\u9700\u6C42\u5E7F\u573A\u3002';
        form.reset(); renderRequests(); return;
      }
      $('#request-feedback').textContent = requestsSaved ? '\u5236\u4F5C\u9700\u6C42\u5DF2\u4FDD\u5B58\u5230\u6B64\u6D4F\u89C8\u5668\u3002\u53EF\u5BFC\u51FA\u4EA4\u7ED9\u4F60\u9009\u62E9\u7684 AI\uFF1B\u5C1A\u672A\u516C\u5F00\u6295\u7A3F\u3002' : '\u9700\u6C42\u5DF2\u52A0\u5165\u5F53\u524D\u9875\u9762\uFF1B\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u6301\u4E45\u4FDD\u5B58\uFF0C\u8BF7\u53CA\u65F6\u5BFC\u51FA\u3002';
      form.reset();
      $('#request-search').value = '';
      $('#request-state').value = 'all';
      renderRequests();
    } catch (error) { $('#request-feedback').textContent = error.message; }
    finally {
      requestPublishing = false;
      try { $('#request-publish').disabled = !submissionRepository?.() && !session()?.available; }
      catch { $('#request-publish').disabled = true; }
    }
  });
  $('#export-requests').addEventListener('click', () => {
    const wanted = allRequests().filter(item => item.id.startsWith('local-') || requestState.supported.includes(item.id) || requestState.following.includes(item.id));
    if (!wanted.length) { toast('\u5148\u4FDD\u5B58\u4E00\u9879\u5236\u4F5C\u9700\u6C42\uFF0C\u6216\u652F\u6301\u3001\u5173\u6CE8\u4E00\u9879\u63D0\u6848\uFF0C\u518D\u5BFC\u51FA\u3002'); return; }
    const content = \`# \u6211\u7684\u684C\u5BA0\u5236\u4F5C\u9700\u6C42\\n\\n\u4EE5\u4E0B\u662F\u7528\u6237\u7684\u89D2\u8272\u521B\u610F\uFF0C\u53EF\u4EA4\u7ED9\u7528\u6237\u9009\u62E9\u7684\u4EFB\u610F AI \u534F\u52A9\u8BBE\u8BA1\u3002\u6B64\u6587\u4EF6\u672A\u5411\u516C\u5171\u793E\u533A\u6295\u7A3F\u3002\\n\\n\${wanted.map(item => \`## \${item.title}\\n\\n- \u5206\u7C7B\uFF1A\${item.category}\\n- \u56FE\u96C6\u7248\u672C\uFF1AV\${item.version}\\n- \u72B6\u6001\uFF1A\u5F85\u5236\u4F5C\\n\\n\${item.description}\\n\`).join('\\n')}\\n\u5B8C\u6574\u56FE\u96C6\u5C3A\u5BF8\u548C\u4E5D\u7EC4\u52A8\u4F5C\u8981\u6C42\u8BF7\u53C2\u89C1\u7F51\u7AD9\u5171\u521B\u5DE5\u4F5C\u53F0\u7684\u5236\u4F5C\u8BF4\u660E\u3002\u4FDD\u7559\u89D2\u8272\u6765\u6E90\u4E0E\u8BB8\u53EF\uFF0C\u4E0D\u628A\u9759\u6001\u5934\u50CF\u5F53\u4F5C\u5B8C\u6574\u52A8\u753B\u3002\\n\`;
    $('#request-export').hidden = false;
    $('#request-export-text').value = content;
    $('#request-feedback').textContent = '\u5236\u4F5C\u9700\u6C42\u8BF4\u660E\u5DF2\u751F\u6210\uFF0C\u4E0B\u65B9\u53EF\u76F4\u63A5\u590D\u5236\uFF1B\u4FDD\u5B58\u94FE\u63A5\u7528\u4E8E\u4E0B\u8F7D Markdown\u3002';
    download(new Blob([content], { type: 'text/markdown;charset=utf-8' }), '\u6211\u7684\u684C\u5BA0\u5236\u4F5C\u9700\u6C42.md');
  });
  $('#copy-request-export').addEventListener('click', () => {
    void copyGalleryText($('#request-export-text').value, '\u5236\u4F5C\u9700\u6C42\u5DF2\u590D\u5236\uFF0C\u53EF\u4EE5\u4EA4\u7ED9\u4F60\u9009\u62E9\u7684 AI\u3002');
  });
  document.addEventListener('click', async event => {
    const support = event.target.closest('[data-request-support], [data-request-follow]');
    if (support) {
      const id = support.dataset.requestSupport || support.dataset.requestFollow;
      if (!allRequests().some(item => item.id === id)) return;
      const key = support.dataset.requestSupport ? 'supported' : 'following';
      const index = requestState[key].indexOf(id);
      if (index < 0) requestState[key].push(id);
      else requestState[key].splice(index, 1);
      saveRequests();
      render(currentRoute, currentId, currentAuthor);
      const attribute = key === 'supported' ? 'data-request-support' : 'data-request-follow';
      Array.from(document.querySelectorAll(\`[\${attribute}]\`)).find(button => button.getAttribute(attribute) === id && button.closest(currentRoute === 'requests' ? '#request-list' : '#request-preview'))?.focus({ preventScroll: true });
    }
    const share = event.target.closest('[data-share-collection]');
    if (share) {
      const url = new URL(location.href);
      url.hash = \`collections/\${share.dataset.shareCollection}\`;
      await copyGalleryText(url.href, url.hostname === '127.0.0.1' ? '\u672C\u673A\u5408\u96C6\u94FE\u63A5\u5DF2\u590D\u5236\uFF1B\u5176\u4ED6\u7535\u8111\u8BF7\u5206\u4EAB\u4F5C\u54C1 ZIP\u3002' : '\u5408\u96C6\u94FE\u63A5\u5DF2\u590D\u5236\u3002');
    }
    const author = event.target.closest('[data-author-filter]');
    if (author) { event.preventDefault(); browseGallery(author.dataset.authorFilter, author.dataset.authorKind || 'pets'); }
    const category = event.target.closest('[data-ranking-category]');
    if (category) { event.preventDefault(); browseGallery(category.dataset.rankingCategory, 'plugins'); }
  });
  return { render, refresh: () => render(currentRoute, currentId, currentAuthor), setPublicRequests(items) { publicRequests = items; requestState = normalizeRequestState(requestState, [...seedIds, ...items.map(item => item.id)]); render(currentRoute, currentId, currentAuthor); } };
}
`,type:"text/javascript; charset=utf-8"},"/package-core.js":{body:`import { validateImportedPluginManifest, validateMediaPetMetadata, validateCodexPetMetadata, petMediaActions, petMediaOptionalActions, pluginAssetMaxBytes, pluginPanelMaxBytes } from './native-package-contract.js';

const encoder = new TextEncoder();
const reservedId = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\\.|$)/i;
export const petStateIds = [...petMediaActions, ...petMediaOptionalActions];

function field(value, label, max, required = true) {
  if (typeof value !== 'string' || value.length > max || /[\\p{Cc}\\p{Cf}\\u2028\\u2029]/u.test(value)) {
    throw new Error(\`\${label}\u683C\u5F0F\u65E0\u6548\u6216\u8D85\u8FC7 \${max} \u5B57\u3002\`);
  }
  const text = value.trim();
  if (required && !text) throw new Error(\`\u8BF7\u586B\u5199\${label}\u3002\`);
  return text;
}

export function attribution(input) {
  return {
    author: field(input.author, '\u4F5C\u8005', 120),
    source: field(input.source ?? '', '\u6765\u6E90', 1000, false),
    license: field(input.license, '\u8BB8\u53EF\u58F0\u660E', 200),
  };
}

export function petManifest(input, version) {
  const id = field(input.id, '\u4F5C\u54C1 ID', 64);
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) || id === 'builtin' || reservedId.test(id)) {
    throw new Error('\u4F5C\u54C1 ID \u53EA\u80FD\u5305\u542B\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u77ED\u6A2A\u7EBF\u548C\u4E0B\u5212\u7EBF\uFF0C\u4E0D\u80FD\u4F7F\u7528\u7CFB\u7EDF\u4FDD\u7559\u540D\u3002');
  }
  if (version !== 1 && version !== 2) throw new Error('\u8BF7\u9009\u62E9\u6709\u6548\u7684 V1 \u6216 V2 \u56FE\u96C6\u3002');
  return {
    id,
    displayName: field(input.displayName, '\u540D\u79F0', 80),
    description: field(input.description, '\u7B80\u4ECB', 500),
    spritesheetPath: 'spritesheet.webp',
    ...(version === 2 ? { spriteVersionNumber: 2 } : {}),
  };
}

export function pluginManifest(input) {
  const id = field(input.id, '\u63D2\u4EF6 ID', 64);
  if (!/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/.test(id) || reservedId.test(id) || id.startsWith('openpets.')) {
    throw new Error('\u63D2\u4EF6 ID \u9700\u4E3A 3 \u81F3 64 \u4F4D\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u70B9\u3001\u77ED\u6A2A\u7EBF\u6216\u4E0B\u5212\u7EBF\uFF0C\u4E0D\u80FD\u4F7F\u7528\u5185\u7F6E\u524D\u7F00\u548C\u7CFB\u7EDF\u4FDD\u7559\u540D\u3002');
  }
  const name = field(input.title, '\u63D2\u4EF6\u540D\u79F0', 120);
  const description = field(input.description ?? '', '\u8BF4\u660E', 1000, false);
  const speech = field(input.speech, '\u53F0\u8BCD', 140);
  if ([name, description, speech].some(text => text.startsWith('$t:'))) throw new Error('\u8BF7\u76F4\u63A5\u586B\u5199\u53F0\u8BCD\uFF0C\u4E0D\u8981\u4F7F\u7528\u672A\u5B9A\u4E49\u7684\u7FFB\u8BD1\u5F15\u7528\u3002');
  const everyMinutes = Number(input.everyMinutes);
  if (!Number.isInteger(everyMinutes) || everyMinutes < 5 || everyMinutes > 1440) throw new Error('\u95F4\u9694\u5FC5\u987B\u4E3A 5 \u81F3 1440 \u7684\u6574\u6570\u5206\u949F\u3002');
  const reactions = ['idle', 'thinking', 'working', 'editing', 'running', 'testing', 'waiting', 'waving', 'success', 'error', 'celebrating'];
  const reaction = input.reaction || undefined;
  if (reaction && !reactions.includes(reaction)) throw new Error('\u8BF7\u9009\u62E9\u652F\u6301\u7684\u53CD\u5E94\u3002');
  return {
    manifestVersion: 1, id, name,
    ...(description ? { description } : {}),
    version: '1.0.0', runtime: 'declarative', icon: 'bell',
    permissions: ['timer', 'pet:speak', ...(reaction ? ['pet:reaction'] : [])],
    triggers: [{ on: 'timer', everyMinutes, actions: [
      { type: 'pet.speak', message: speech },
      ...(reaction ? [{ type: 'pet.react', reaction }] : []),
    ] }],
  };
}

export function shareNotes(title, credit, kind) {
  const text = \`# \${title}\\n\\n\u4F5C\u8005\uFF1A\${credit.author}\\n\u6765\u6E90\uFF1A\${credit.source}\\n\u8BB8\u53EF\u58F0\u660E\uFF1A\${credit.license}\\n\\n\u4EE5\u4E0A\u4E3A\u586B\u5199\u8005\u58F0\u660E\uFF0C\u672A\u7ECF\u5E73\u53F0\u6838\u5B9E\u3002\\n\\n\${kind === 'pet' ? '\u5728\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u300C\u6211\u7684\u684C\u5BA0\u300D\u5BFC\u5165 ZIP\u3002' : '\u5728\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u300C\u63D2\u4EF6\u7BA1\u7406\u300D\u5BFC\u5165 ZIP \u6216\u6587\u4EF6\u5939\uFF0C\u786E\u8BA4\u6743\u9650\u540E\u542F\u7528\u3002\u5176\u4ED6\u5BBF\u4E3B\u63D2\u4EF6\u9700\u8981\u9002\u914D\u540E\u624D\u80FD\u8FD0\u884C\u3002'}\\n\\n\u672C\u5305\u4FDD\u7559\u4E0A\u4F20\u7684\u4F5C\u54C1\u6587\u4EF6\u3002\u5206\u4EAB\u524D\u786E\u8BA4\u5176\u4E2D\u6CA1\u6709\u5BC6\u94A5\u3001\u79C1\u4EBA\u914D\u7F6E\u6216\u804A\u5929\u8BB0\u5F55\u3002\u8BF7\u4FDD\u7559\u539F\u5305\u3001\u4F5C\u8005\u58F0\u660E\u548C\u8BB8\u53EF\u8BC1\u3002\\n\`;
  if (encoder.encode(text).length > 16 * 1024) throw new Error('\u5206\u4EAB\u8BF4\u660E\u8FC7\u5927\u3002');
  return text;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// \u5C0F\u578B\u65E0\u538B\u7F29 ZIP \u5199\u5165\u5668\uFF1B\u6D4F\u89C8\u5668\u56FE\u96C6\u5DF2\u538B\u7F29\uFF0C\u4E0D\u518D\u5F15\u5165\u989D\u5916\u538B\u7F29\u4F9D\u8D56\u3002
export function zipPackage(files) {
  if (Object.keys(files).length > 1000) throw new Error('\u7D20\u6750\u5305\u6700\u591A\u5305\u542B 1000 \u4E2A\u6587\u4EF6\u3002');
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, value] of Object.entries(files)) {
    safePackagePath(name);
    const filename = encoder.encode(name);
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    if (!(bytes instanceof Uint8Array)) throw new Error('\u5305\u6587\u4EF6\u5185\u5BB9\u65E0\u6548\u3002');
    const checksum = crc32(bytes);
    const header = new Uint8Array(30 + filename.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint16(12, 33, true);
    view.setUint32(14, checksum, true);
    view.setUint32(18, bytes.length, true);
    view.setUint32(22, bytes.length, true);
    view.setUint16(26, filename.length, true);
    header.set(filename, 30);
    local.push(header, bytes);
    const entry = new Uint8Array(46 + filename.length);
    const directory = new DataView(entry.buffer);
    directory.setUint32(0, 0x02014b50, true);
    directory.setUint16(4, 20, true);
    directory.setUint16(6, 20, true);
    directory.setUint16(8, 0x800, true);
    directory.setUint16(14, 33, true);
    directory.setUint32(16, checksum, true);
    directory.setUint32(20, bytes.length, true);
    directory.setUint32(24, bytes.length, true);
    directory.setUint16(28, filename.length, true);
    directory.setUint32(42, offset, true);
    entry.set(filename, 46);
    central.push(entry);
    offset += header.length + bytes.length;
  }
  const centralLength = central.reduce((total, bytes) => total + bytes.length, 0);
  if (offset + centralLength + 22 > 200 * 1024 * 1024) throw new Error('\u7D20\u6750\u5305\u8D85\u8FC7 200 MB\u3002');
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, central.length, true);
  view.setUint16(10, central.length, true);
  view.setUint32(12, centralLength, true);
  view.setUint32(16, offset, true);
  return new Blob([...local, ...central, end], { type: 'application/zip' });
}

// \u5305\u5185\u8DEF\u5F84\u53EA\u7528\u4E8E\u8BFB\u53D6\u4E0E\u5F52\u6863\uFF0C\u4E0D\u89E3\u91CA\u4E3A\u7535\u8111\u8DEF\u5F84\uFF0C\u4E5F\u4E0D\u6267\u884C\u4E0A\u4F20\u4EE3\u7801\u3002
export function safePackagePath(value) {
  if (typeof value !== 'string' || value.length > 240 || !value || value.split('/').length > 13 || /[\\\\:<>"|?*\\p{Cc}\\p{Cf}]/u.test(value) || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part) || reservedId.test(part))) {
    throw new Error('\u6587\u4EF6\u8DEF\u5F84\u65E0\u6548\uFF1A\u8BF7\u4F7F\u7528\u4E0D\u542B\u4E0A\u7EA7\u76EE\u5F55\u3001\u7EDD\u5BF9\u5730\u5740\u6216\u7CFB\u7EDF\u4FDD\u7559\u540D\u7684\u5305\u5185\u8DEF\u5F84\u3002');
  }
  return value;
}

export async function readZipPackage(input, inflate, { maxTotalBytes = 200 * 1024 * 1024, maxFileBytes = 100 * 1024 * 1024 } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > 200 * 1024 * 1024) throw new Error('ZIP \u8D85\u8FC7 200 MB\uFF0C\u8BF7\u5206\u5F00\u6574\u7406\u7D20\u6750\u3002');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) {
    if (view.getUint32(at, true) === 0x06054b50 && at + 22 + view.getUint16(at + 20, true) === bytes.length) { end = at; break; }
  }
  if (end < 0) throw new Error('ZIP \u76EE\u5F55\u635F\u574F\u6216\u4E0D\u662F\u53D7\u652F\u6301\u7684 ZIP\u3002');
  const count = view.getUint16(end + 10, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || count !== view.getUint16(end + 8, true) || count > 1000) throw new Error('\u4E0D\u652F\u6301\u5206\u5377 ZIP\uFF0C\u6216\u6587\u4EF6\u6570\u91CF\u8D85\u8FC7 1000\u3002');
  const files = Object.create(null);
  const names = new Set();
  let at = view.getUint32(end + 16, true);
  let total = 0;
  for (let index = 0; index < count; index++) {
    if (at + 46 > end || view.getUint32(at, true) !== 0x02014b50) throw new Error('ZIP \u6587\u4EF6\u76EE\u5F55\u635F\u574F\u3002');
    const flags = view.getUint16(at + 8, true);
    const method = view.getUint16(at + 10, true);
    const compressedSize = view.getUint32(at + 20, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const next = at + 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    if (next > end || flags & 1 || ![0, 8].includes(method) || (view.getUint32(at + 38, true) >>> 16 & 0xf000) === 0xa000) throw new Error('ZIP \u5305\u542B\u52A0\u5BC6\u6587\u4EF6\u3001\u94FE\u63A5\u6216\u4E0D\u652F\u6301\u7684\u538B\u7F29\u65B9\u5F0F\u3002');
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const directory = name.endsWith('/');
    safePackagePath(directory ? name.slice(0, -1) : name);
    const key = name.toLocaleLowerCase();
    if (names.has(key)) throw new Error('ZIP \u5305\u542B\u91CD\u540D\u6587\u4EF6\u3002');
    names.add(key);
    if (!directory) {
      total += size;
      if (size > maxFileBytes || total > maxTotalBytes) throw new Error('ZIP \u5185\u6587\u4EF6\u5927\u5C0F\u6216\u603B\u91CF\u8D85\u8FC7\u8BFB\u53D6\u9650\u5236\u3002');
      const local = view.getUint32(at + 42, true);
      if (local + 30 > at || view.getUint32(local, true) !== 0x04034b50) throw new Error('ZIP \u6587\u4EF6\u5934\u635F\u574F\u3002');
      const offset = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      if (offset + compressedSize > at) throw new Error('ZIP \u6587\u4EF6\u6570\u636E\u8D8A\u754C\u3002');
      const compressed = bytes.subarray(offset, offset + compressedSize);
      const value = method === 0 ? compressed.slice() : await inflate(compressed, size);
      if (value.length !== size || crc32(value) !== view.getUint32(at + 16, true)) throw new Error('ZIP \u6587\u4EF6\u6821\u9A8C\u5931\u8D25\u3002');
      files[name] = value;
    }
    at = next;
  }
  return files;
}

export function normalizePackageFiles(input) {
  const files = Object.create(null);
  const entries = Object.entries(input);
  if (!entries.length || entries.length > 1000) throw new Error('\u8BF7\u9009\u62E9 1 \u81F3 1000 \u4E2A\u6587\u4EF6\u3002');
  let total = 0;
  const names = new Set();
  for (const [name, value] of entries) {
    safePackagePath(name);
    if (!(value instanceof Uint8Array)) throw new Error('\u6587\u4EF6\u5185\u5BB9\u65E0\u6548\u3002');
    total += value.length;
    if (value.length > 100 * 1024 * 1024 || total > 200 * 1024 * 1024) throw new Error('\u5355\u6587\u4EF6\u8D85\u8FC7 100 MB \u6216\u6587\u4EF6\u603B\u91CF\u8D85\u8FC7 200 MB\u3002');
    if (names.has(name.toLocaleLowerCase())) throw new Error('\u5B58\u5728\u5927\u5C0F\u5199\u51B2\u7A81\u7684\u540C\u540D\u6587\u4EF6\u3002');
    names.add(name.toLocaleLowerCase());
  }
  let prefix = '';
  const first = entries[0][0].split('/');
  while (first.length > 1 && entries.every(([name]) => name.startsWith(\`\${prefix}\${first[0]}/\`))) {
    prefix += \`\${first.shift()}/\`;
  }
  for (const [name, value] of entries) files[name.slice(prefix.length)] = value;
  return files;
}

function pluginAttachments(manifest, files) {
  const required = [];
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (manifest.assets !== undefined) {
    if (!record(manifest.assets)) throw new Error('\u63D2\u4EF6 assets \u9700\u8981\u6309\u7D20\u6750\u79CD\u7C7B\u58F0\u660E\u6587\u4EF6\u3002');
    for (const [kind, group] of Object.entries(manifest.assets)) {
      if (!['icons', 'images', 'svgs', 'sprites', 'sounds'].includes(kind) || !record(group)) throw new Error('\u63D2\u4EF6\u7D20\u6750\u79CD\u7C7B\u6216\u6587\u4EF6\u58F0\u660E\u65E0\u6548\u3002');
      for (const declaration of Object.values(group)) {
        const path = kind === 'sprites' && record(declaration) ? declaration.path : declaration;
        safePackagePath(path);
        if (files[path]?.length > pluginAssetMaxBytes[kind]) throw new Error(\`\u63D2\u4EF6 \${kind} \u9644\u4EF6\u8D85\u8FC7\u5927\u5C0F\u4E0A\u9650\uFF1A\${path}\u3002\`);
        required.push(path);
      }
    }
  }
  if (manifest.panels !== undefined) {
    if (!record(manifest.panels)) throw new Error('\u63D2\u4EF6 panels \u9700\u8981\u58F0\u660E\u5BF9\u5E94\u9875\u9762\u6587\u4EF6\u3002');
    for (const path of Object.values(manifest.panels)) { safePackagePath(path); if (files[path]?.length > pluginPanelMaxBytes) throw new Error(\`\u63D2\u4EF6\u9762\u677F\u8D85\u8FC7 1 MB\uFF1A\${path}\u3002\`); required.push(path); }
  }
  const references = new Set();
  const values = [manifest.name, manifest.description, manifest.configSchema, manifest.triggers];
  while (values.length) {
    const value = values.pop();
    if (typeof value === 'string' && value.startsWith('$t:')) references.add(value.slice(3));
    else if (value !== null && typeof value === 'object') values.push(...Object.values(value));
  }
  const translations = new Map();
  for (const name of Object.keys(files).filter(name => /^locales\\/[^/]+\\.json$/.test(name))) {
    safePackagePath(name);
    if (files[name].length > 256 * 1024) throw new Error(\`\u7FFB\u8BD1\u9644\u4EF6\u8D85\u8FC7 256 KB\uFF1A\${name}\u3002\`);
    let locale;
    try { locale = JSON.parse(new TextDecoder().decode(files[name])); }
    catch { throw new Error(\`\u7FFB\u8BD1\u9644\u4EF6\u4E0D\u662F\u6709\u6548 JSON\uFF1A\${name}\u3002\`); }
    if (!record(locale) || Object.values(locale).some(value => typeof value !== 'string')) throw new Error(\`\u7FFB\u8BD1\u9644\u4EF6\u9700\u8981\u662F\u6587\u5B57\u952E\u503C\u8868\uFF1A\${name}\u3002\`);
    translations.set(name, locale);
  }
  if (references.size) {
    required.push('locales/en.json');
    const fallback = translations.get('locales/en.json');
    if (fallback) for (const key of references) if (!Object.hasOwn(fallback, key)) throw new Error(\`\u7FFB\u8BD1\u9644\u4EF6 locales/en.json \u7F3A\u5C11\u6587\u5B57\u952E\uFF1A\${key}\u3002\u8BF7\u8865\u5145\u5B8C\u6574\u7FFB\u8BD1\u6587\u4EF6\u3002\`);
  }
  return required;
}

export function inspectPackage(files, kind) {
  const candidates = kind === 'pet' ? ['pet.json', 'manifest.json', 'metadata.json'] : ['desktop-pet.plugin.json', 'plugin.json', 'openpets.plugin.json', 'manifest.json', 'package.json'];
  const manifestName = candidates.find(name => Object.hasOwn(files, name));
  if (!manifestName && kind === 'pet' && Object.hasOwn(files, 'conf/actions.xml') && Object.keys(files).some(name => /^img\\/.*\\.png$/i.test(name))) {
    return { manifestName: 'conf/actions.xml', manifest: {}, compatibility: 'Shimeji \u56FE\u50CF\u5E8F\u5217 \xB7 \u684C\u9762\u5BFC\u5165\u8F6C\u6362\uFF0CJava \u884C\u4E3A\u9700\u4E13\u7528\u5F15\u64CE', fileCount: Object.keys(files).length, bytes: Object.values(files).reduce((sum, value) => sum + value.length, 0) };
  }
  if (!manifestName) return { manifestName: null, manifest: {}, workInfo: {}, compatibility: \`\${kind === 'pet' ? '\u81EA\u5B9A\u4E49\u684C\u5BA0\u7D20\u6750' : '\u672A\u8BC6\u522B\u5BBF\u4E3B\u63D2\u4EF6'} \xB7 \u4EC5\u5F52\u6863\u5206\u4EAB\uFF0C\u8FD0\u884C\u9700\u9002\u914D\`, fileCount: Object.keys(files).length, bytes: Object.values(files).reduce((sum, value) => sum + value.length, 0) };
  if (files[manifestName].length > 1024 * 1024) throw new Error('\u6E05\u5355\u8D85\u8FC7 1 MB\u3002');
  let manifest;
  try { manifest = JSON.parse(new TextDecoder().decode(files[manifestName])); }
  catch { throw new Error('\u4F5C\u54C1\u6E05\u5355\u4E0D\u662F\u6709\u6548\u7684 JSON\uFF0C\u8BF7\u68C0\u67E5\u540E\u91CD\u65B0\u5BFC\u5165\u3002'); }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('\u6E05\u5355\u9700\u8981\u662F JSON \u5BF9\u8C61\u3002');
  const required = [];
  let compatibility;
  if (kind === 'pet') {
    if (manifest.mediaVersion === 1 && manifest.actions && typeof manifest.actions === 'object') {
      required.push(...Object.values(manifest.actions));
      if (!manifest.actions.idle) throw new Error('\u52A8\u4F5C\u5305\u9700\u8981 idle \u5F85\u673A\u52A8\u4F5C\uFF0C\u5176\u4ED6\u72B6\u6001\u53EF\u7ED1\u5B9A\u4EFB\u610F\u52A8\u4F5C\u3002');
      compatibility = '\u72EC\u7ACB\u52A8\u4F5C\u5305';
    } else if (typeof manifest.spritesheetPath === 'string' || Object.hasOwn(files, 'spritesheet.webp')) {
      required.push(manifest.spritesheetPath || 'spritesheet.webp');
      compatibility = 'WebP \u56FE\u96C6\u5305';
    } else compatibility = '\u5176\u4ED6\u684C\u5BA0\u683C\u5F0F \xB7 \u53EF\u4FDD\u5B58\u5206\u4EAB\uFF0C\u8FD0\u884C\u9700\u9002\u914D';
  } else {
    const supported = manifest.runtime === 'declarative' && manifest.manifestVersion === 1 || manifest.runtime === 'javascript' && [2, 3].includes(manifest.manifestVersion);
    compatibility = supported ? \`SDK \${manifest.manifestVersion} \xB7 \${manifest.runtime === 'javascript' ? 'JavaScript' : '\u58F0\u660E\u5F0F'}\` : '\u5176\u4ED6\u5BBF\u4E3B\u63D2\u4EF6 \xB7 \u53EF\u4FDD\u5B58\u5206\u4EAB\uFF0C\u8FD0\u884C\u9700\u9002\u914D';
    if (supported) {
      if (files[manifestName].length > 64 * 1024) throw new Error('\u63D2\u4EF6\u6E05\u5355\u8D85\u8FC7 64 KB\u3002');
      const result = validateImportedPluginManifest(manifest);
      if (!result.ok) throw new Error(\`\u63D2\u4EF6\u6E05\u5355\u5B57\u6BB5\u65E0\u6548\uFF1A\${result.errors.map(error => error.path).join('\u3001')}\u3002\`);
    }
    if (supported && manifest.runtime === 'javascript') {
      if (typeof manifest.entry !== 'string') throw new Error('JavaScript \u63D2\u4EF6\u9700\u8981\u58F0\u660E\u5165\u53E3\u6587\u4EF6\u3002');
      if (files[manifest.entry]?.length > 1024 * 1024) throw new Error('\u63D2\u4EF6\u5165\u53E3\u8D85\u8FC7 1 MB\u3002');
      required.push(manifest.entry);
    }
    if (supported) required.push(...pluginAttachments(manifest, files));
  }
  for (const name of required) {
    safePackagePath(name);
    if (!Object.hasOwn(files, name)) throw new Error(\`\u7F3A\u5C11\u6E05\u5355\u5F15\u7528\u9644\u4EF6\uFF1A\${name}\u3002\u8BF7\u4E0A\u4F20\u5305\u542B\u6B64\u6587\u4EF6\u7684\u5B8C\u6574\u6587\u4EF6\u5939\u6216 ZIP\uFF0C\u6216\u8865\u9009\u5168\u90E8\u914D\u5957\u6587\u4EF6\u3002\`);
  }
  let submission = {};
  if (files['submission.json']?.length <= 1024 * 1024) {
    try { const value = JSON.parse(new TextDecoder().decode(files['submission.json'])); if (value && typeof value === 'object' && !Array.isArray(value)) submission = value; }
    catch { /* \u53EF\u9009\u6295\u7A3F\u8BF4\u660E\u635F\u574F\uFF0C\u4E0D\u963B\u6B62\u8BFB\u53D6\u8FD0\u884C\u7D20\u6750\u3002 */ }
  }
  function readable(value) {
    if (typeof value !== 'string') return '';
    if (!value.startsWith('$t:')) return value;
    for (const name of ['locales/zh-Hans.json', 'locales/zh-CN.json', 'locales/en.json']) {
      if (!files[name] || files[name].length > 1024 * 1024) continue;
      try { const translations = JSON.parse(new TextDecoder().decode(files[name])); if (typeof translations?.[value.slice(3)] === 'string') return translations[value.slice(3)]; }
      catch { /* \u65E0\u53EF\u7528\u7FFB\u8BD1\u65F6\u8BA9\u586B\u5199\u8005\u81EA\u884C\u586B\u5199\u4F5C\u54C1\u4FE1\u606F\u3002 */ }
    }
    return '';
  }
  const workInfo = { id: readable(manifest.id), title: readable(manifest.displayName || manifest.title || manifest.name), description: readable(manifest.description || submission.description), author: readable(manifest.author || submission.author), source: readable(manifest.sourceUrl || submission.source_url), license: readable(manifest.license || submission.license) };
  const bytes = Object.values(files).reduce((sum, value) => sum + value.length, 0);
  const runtimeWarning = kind === 'plugin' && bytes > 32 * 1024 * 1024 ? '\u8D85\u8FC7\u672C\u5730\u63D2\u4EF6 32 MB \u8FD0\u884C\u5BFC\u5165\u4E0A\u9650\uFF1B\u53EF\u5B8C\u6574\u5F52\u6863\u5206\u4EAB\uFF0C\u8FD0\u884C\u524D\u9700\u7CBE\u7B80\u4F5C\u54C1\u6587\u4EF6\u3002' : '';
  return { manifestName, manifest, workInfo, compatibility, runtimeWarning, fileCount: Object.keys(files).length, bytes };
}

export function videoPetManifest(input, clips, bindings, background) {
  const manifest = petManifest(input, 1);
  delete manifest.spritesheetPath;
  if (!clips.length || clips.length > 100) throw new Error('\u8BF7\u4E0A\u4F20 1 \u81F3 100 \u4E2A\u72EC\u7ACB\u52A8\u4F5C\u3002');
  const actions = Object.create(null);
  const actionDefinitions = Object.create(null);
  for (const clip of clips) {
    const id = field(clip.id, '\u52A8\u4F5C ID', 64);
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) || ['constructor', 'prototype', '__proto__'].includes(id) || Object.hasOwn(actions, id)) throw new Error('\u52A8\u4F5C ID \u9700\u552F\u4E00\uFF0C\u4F7F\u7528\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u77ED\u6A2A\u7EBF\u548C\u4E0B\u5212\u7EBF\uFF0C\u5E76\u907F\u5F00\u7CFB\u7EDF\u4FDD\u7559\u6807\u8BC6\u3002');
    safePackagePath(clip.file);
    if (!/\\.(mp4|webm|webp)$/i.test(clip.file)) throw new Error('\u52A8\u4F5C\u9700\u4E3A MP4\u3001WebM \u6216\u52A8\u753B WebP\u3002');
    actions[id] = clip.file;
    actionDefinitions[id] = { displayName: field(clip.displayName, '\u52A8\u4F5C\u540D\u79F0', 80), category: field(clip.category, '\u52A8\u4F5C\u79CD\u7C7B', 80) };
  }
  if (!actions.idle) actions.idle = actions[bindings.idle || clips[0].id];
  if (!actions.idle) throw new Error('\u8BF7\u9009\u62E9\u5F85\u673A\u52A8\u4F5C\u3002');
  const stateBindings = {};
  for (const [state, id] of Object.entries(bindings)) {
    if (!petStateIds.includes(state)) throw new Error('AI \u4E0E\u4EA4\u4E92\u72B6\u6001\u7ED1\u5B9A\u65E0\u6548\u3002');
    if (id && !actions[id]) throw new Error('\u72B6\u6001\u7ED1\u5B9A\u7684\u52A8\u4F5C\u4E0D\u5B58\u5728\u3002');
    if (id) stateBindings[state] = id;
  }
  if (!['alpha', 'chroma'].includes(background.mode) || background.mode === 'chroma' && !/^#[a-f0-9]{6}$/i.test(background.color)) throw new Error('\u8BF7\u9009\u62E9\u900F\u660E\u901A\u9053\u6216\u6709\u6548\u53BB\u80CC\u989C\u8272\u3002');
  if (background.mode === 'alpha' && clips.some(clip => clip.file.toLowerCase().endsWith('.mp4'))) throw new Error('MP4 \u6CA1\u6709\u900F\u660E\u901A\u9053\uFF0C\u8BF7\u9009\u62E9\u7EAF\u8272\u80CC\u666F\u53BB\u80CC\u3002');
  return validateMediaPetMetadata({ ...manifest, mediaVersion: 1, actions, actionDefinitions, stateBindings, background }, manifest.id);
}

export function coverImageType(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > 10 * 1024 * 1024) throw new Error('\u5C01\u9762\u9700\u4E3A 10 MB \u4EE5\u5185\u7684 PNG\u3001JPEG \u6216 WebP \u56FE\u7247\u3002');
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return { extension: 'png', mime: 'image/png' };
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { extension: 'jpg', mime: 'image/jpeg' };
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP') return { extension: 'webp', mime: 'image/webp' };
  throw new Error('\u5C01\u9762\u9700\u4E3A PNG\u3001JPEG \u6216 WebP \u56FE\u7247\uFF0C\u4E0D\u652F\u6301 SVG \u6216\u7F51\u9875\u6587\u4EF6\u3002');
}

export function packageWorkFields(current, incoming, replace = false) {
  return Object.fromEntries(['id', 'title', 'description', 'author', 'source', 'license'].map(key => {
    const value = typeof incoming?.[key] === 'string' && !incoming[key].startsWith('$t:') ? incoming[key] : '';
    return [key, replace ? value : current[key] || value];
  }));
}

function savedWorkInformation(files) {
  const names = Object.keys(files).filter(name => /^WORK-INFO(?:-\\d+)?\\.json$/i.test(name)).sort((a, b) => Number(b.match(/-(\\d+)\\.json$/i)?.[1] || 1) - Number(a.match(/-(\\d+)\\.json$/i)?.[1] || 1));
  for (const name of names) {
    if (files[name].length > 64 * 1024) continue;
    try {
      const value = JSON.parse(new TextDecoder().decode(files[name]));
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    } catch { /* \u539F\u4F5C\u54C1\u4FE1\u606F\u7559\u6863\uFF0C\u5FFD\u7565\u4E0D\u53EF\u8BFB\u53D6\u7684\u53EF\u9009\u8BF4\u660E\u3002 */ }
  }
  return {};
}

// \u53EA\u68C0\u67E5\u6587\u4EF6\u4E0E\u5DF2\u77E5\u6E05\u5355\u7ED3\u6784\uFF0C\u4E0D\u6267\u884C\u63D2\u4EF6\u3001\u539F\u9879\u76EE\u547D\u4EE4\u6216\u52A8\u4F5C\u3002
export function inspectImportPackage(files, kind) {
  const candidates = kind === 'pet' ? ['pet.json', 'manifest.json', 'metadata.json', 'conf/actions.xml'] : ['desktop-pet.plugin.json', 'plugin.json', 'openpets.plugin.json', 'manifest.json', 'package.json'];
  const names = Object.keys(files);
  const manifestPaths = candidates.flatMap(candidate => names.filter(name => name === candidate || name.endsWith(\`/\${candidate}\`)).sort((a, b) => a.split('/').length - b.split('/').length));
  const packageRoots = new Set(manifestPaths.map(name => name.endsWith('conf/actions.xml') ? name.slice(0, -'conf/actions.xml'.length) : name.slice(0, name.length - name.split('/').pop().length)));
  const manifestPath = manifestPaths[0];
  const prefix = manifestPath?.includes('/') ? manifestPath.slice(0, manifestPath.length - (manifestPath.endsWith('conf/actions.xml') ? 'conf/actions.xml'.length : manifestPath.split('/').pop().length)) : '';
  const view = Object.fromEntries(Object.entries(files).filter(([name]) => name.startsWith(prefix)).map(([name, bytes]) => [name.slice(prefix.length), bytes]));
  let info, failure;
  try { info = inspectPackage(view, kind); }
  catch (error) { failure = error.message; info = { manifest: {}, workInfo: {}, compatibility: '\u6E05\u5355\u6216\u9644\u4EF6\u4E0D\u5B8C\u6574' }; }
  if (packageRoots.size > 1) failure = '\u53D1\u73B0\u591A\u4E2A\u4F5C\u54C1\u76EE\u5F55\uFF0C\u8BF7\u5355\u72EC\u9009\u62E9\u9700\u8981\u8FD0\u884C\u7684\u4F5C\u54C1\u5305\uFF1B\u5F53\u524D\u53EA\u4FDD\u7559\u6574\u4E2A\u76EE\u5F55\u5F52\u6863\uFF0C\u4E0D\u81EA\u52A8\u9009\u62E9\u5176\u4E2D\u4E00\u4E2A\u3002';
  const manifest = info.manifest;
  if (!failure && info.compatibility === '\u72EC\u7ACB\u52A8\u4F5C\u5305') {
    try { validateMediaPetMetadata(manifest, manifest.id); }
    catch (error) { failure = error.message; }
  }
  if (!failure && info.compatibility === 'WebP \u56FE\u96C6\u5305' && manifest.spriteVersionNumber !== undefined && ![1, 2].includes(manifest.spriteVersionNumber)) failure = '\u672C\u7CFB\u7EDF\u53EA\u652F\u6301 V1 \u6216 V2 WebP \u56FE\u96C6\u7ED3\u6784\u3002';
  if (!failure && /^SDK /.test(info.compatibility) && (typeof manifest.id !== 'string' || !manifest.id || typeof manifest.name !== 'string' || !manifest.name || typeof manifest.version !== 'string' || !manifest.version || !Array.isArray(manifest.permissions))) failure = 'SDK \u6E05\u5355\u7F3A\u5C11\u6709\u6548\u7684\u7F16\u53F7\u3001\u540D\u79F0\u3001\u7248\u672C\u6216\u6743\u9650\u58F0\u660E\u3002';
  const native = !failure && (kind === 'pet' ? ['\u72EC\u7ACB\u52A8\u4F5C\u5305', 'WebP \u56FE\u96C6\u5305'].includes(info.compatibility) : /^SDK /.test(info.compatibility));
  const shimeji = !failure && info.compatibility.startsWith('Shimeji');
  const raycast = kind === 'plugin' && Array.isArray(manifest.commands) && typeof manifest.name === 'string';
  const live2d = names.some(name => /\\.model3?\\.json$/i.test(name));
  const vpet = names.some(name => /(^|\\/)(VPet.*\\.dll|info\\.lps)$/i.test(name));
  const external = shimeji || raycast || live2d || vpet;
  const bytes = Object.values(files).reduce((sum, value) => sum + value.length, 0);
  const oversizedFile = kind === 'plugin' && names.find(name => files[name].length > 5 * 1024 * 1024);
  const oversized = kind === 'plugin' && (bytes > 32 * 1024 * 1024 || oversizedFile);
  const level = failure ? 'invalid' : native ? oversized ? 'partial' : 'native' : shimeji ? 'partial' : external ? 'external' : 'invalid';
  const capabilities = { archive: true, preview: native && kind === 'pet', actions: native && kind === 'pet', aiBindings: native && kind === 'pet', configuration: native && kind === 'plugin' && !oversized, originalLogic: native && !oversized };
  const format = shimeji ? 'Shimeji' : raycast ? 'Raycast' : live2d ? 'Live2D' : vpet ? 'VPet' : native ? info.compatibility : '\u672A\u8BC6\u522B\u683C\u5F0F';
  const reasons = [failure, oversized ? oversizedFile ? \`\u6587\u4EF6\u8D85\u8FC7\u63D2\u4EF6 5 MB \u4E0A\u9650\uFF1A\${oversizedFile}\u3002\` : '\u8D85\u8FC7\u63D2\u4EF6 32 MB \u4E0A\u9650\u3002' : '', shimeji ? '\u539F\u903B\u8F91\u4ECD\u9700\u4E13\u7528\u5F15\u64CE\u3002' : '', external && !shimeji ? '\u9700\u8981\u539F\u5BBF\u4E3B\u3002' : '', !native && !external && !failure ? '\u672A\u8BC6\u522B\u8FD0\u884C\u683C\u5F0F\u3002' : ''].filter(Boolean);
  const report = { inspection: 'static', level, format, capabilities, supported: ['\u5B8C\u6574\u539F\u5305\u5F52\u6863\u4E0E\u4E0B\u8F7D', ...(native ? [kind === 'pet' ? '\u5DF2\u77E5\u684C\u5BA0\u6E05\u5355\u4E0E\u58F0\u660E\u52A8\u4F5C\u7D20\u6750' : 'SDK \u6E05\u5355\u3001\u5165\u53E3\u4E0E\u58F0\u660E\u9644\u4EF6'] : [])], unsupported: native ? oversized ? ['\u76F4\u63A5\u8FD0\u884C\u5BFC\u5165'] : [] : ['\u672C\u7CFB\u7EDF\u52A8\u4F5C\u63A7\u5236', 'AI \u72B6\u6001\u7ED1\u5B9A', '\u672C\u7CFB\u7EDF\u8FD0\u884C\u914D\u7F6E', '\u81EA\u52A8\u6267\u884C\u539F\u9879\u76EE\u903B\u8F91'], reasons };
  const saved = savedWorkInformation(files);
  const workInfo = { ...info.workInfo };
  for (const key of ['id', 'title', 'description', 'author', 'source', 'license']) if (typeof saved[key] === 'string') workInfo[key] = saved[key];
  let cover = null;
  if (typeof saved.presentation?.cover === 'string') {
    try { const path = safePackagePath(saved.presentation.cover); if (files[path]) cover = { path, bytes: files[path], ...coverImageType(files[path]) }; else report.reasons.push('\u4F5C\u54C1\u5C01\u9762\u9644\u4EF6\u7F3A\u5931\uFF0C\u53EF\u91CD\u65B0\u9009\u62E9\uFF1B\u539F\u6E05\u5355\u548C\u5176\u4ED6\u6587\u4EF6\u4ECD\u4F1A\u4FDD\u7559\u3002'); }
    catch { report.reasons.push('\u4F5C\u54C1\u5C01\u9762\u9644\u4EF6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u539F\u5305\u6587\u4EF6\u4ECD\u4F1A\u4FDD\u7559\u3002'); }
  }
  return { ...info, manifestPath, assetPrefix: prefix, workInfo, cover, report, fileCount: names.length, bytes };
}

export function addWorkInformation(files, input, kind, credit, cover = null, savedAt = new Date().toISOString()) {
  const result = { ...files };
  const occupied = name => Object.keys(result).some(existing => existing.toLocaleLowerCase() === name.toLocaleLowerCase());
  let presentation;
  if (cover) {
    const imageType = coverImageType(cover.bytes);
    const path = safePackagePath(cover.path);
    if (!path.toLowerCase().endsWith(\`.\${imageType.extension}\`) && !(imageType.extension === 'jpg' && path.toLowerCase().endsWith('.jpeg'))) throw new Error('\u5C01\u9762\u6587\u4EF6\u6269\u5C55\u540D\u4E0E\u56FE\u7247\u5185\u5BB9\u4E0D\u4E00\u81F4\u3002');
    if (occupied(path) && !(result[path] instanceof Uint8Array && result[path].length === cover.bytes.length && result[path].every((value, index) => value === cover.bytes[index]))) throw new Error('\u5C01\u9762\u8DEF\u5F84\u4E0E\u5DF2\u6709\u6587\u4EF6\u51B2\u7A81\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u5C01\u9762\u3002');
    result[path] = cover.bytes;
    presentation = { cover: path };
  }
  let infoName = 'WORK-INFO.json';
  for (let index = 2; occupied(infoName); index++) infoName = \`WORK-INFO-\${index}.json\`;
  result[infoName] = encoder.encode(JSON.stringify({ kind, title: input.displayName || input.title, id: input.id, description: input.description, ...credit, ...(presentation ? { presentation } : {}), savedAt, publication: 'local-draft' }, null, 2));
  let notesName = 'SHARE.md';
  for (let index = 2; occupied(notesName); index++) notesName = \`SHARE-\${index}.md\`;
  result[notesName] = encoder.encode(shareNotes(input.displayName || input.title, credit, kind));
  return result;
}

export function prepareWorkPackage(files, input, kind, workflow, cover = null) {
  if (![\`\${kind}-make\`, \`\${kind}-import\`].includes(workflow)) throw new Error('\u8BF7\u9009\u62E9\u5236\u4F5C\u6216\u5BFC\u5165\u5165\u53E3\u3002');
  const bytes = Object.fromEntries(Object.entries(files).map(([name, value]) => [name, typeof value === 'string' ? encoder.encode(value) : value]));
  const result = addWorkInformation(bytes, input, kind, attribution(input), cover);
  if (workflow.endsWith('-import')) return result;
  const info = inspectImportPackage(result, kind);
  if (info.report.level !== 'native') throw new Error(info.report.reasons.join(' ') || '\u5236\u4F5C\u5305\u4E0D\u7B26\u5408\u672C\u7CFB\u7EDF\u683C\u5F0F\uFF1B\u539F\u9879\u76EE\u8BF7\u4F7F\u7528\u5BFC\u5165\u5165\u53E3\u3002');
  if (kind === 'pet') {
    if (info.manifest.mediaVersion === 1) {
      for (const path of new Set(Object.values(info.manifest.actions))) mediaFileInfo(result[info.assetPrefix + path], path, info.manifest.background.mode === 'alpha');
    } else validateCodexPetMetadata(info.manifest, info.manifest.id);
  }
  return result;
}

// \u5236\u4F5C\u51FA\u53E3\u68C0\u67E5\u771F\u5B9E\u6587\u4EF6\u5934\u4E0E WebP \u5E27\u58F0\u660E\uFF1B\u5BFC\u5165\u5F52\u6863\u4E0D\u6539\u5199\u539F\u4EF6\u3002
export function mediaFileInfo(bytes, path, needsAlpha = false) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 100 * 1024 * 1024) throw new Error(\`\u52A8\u4F5C\u7D20\u6750\u7F3A\u5931\u6216\u8D85\u8FC7 100 MB\uFF1A\${path}\u3002\`);
  const ascii = (start, end) => new TextDecoder('ascii').decode(bytes.subarray(start, end));
  if (/\\.mp4$/i.test(path)) {
    if (bytes.length < 24 || ascii(4, 8) !== 'ftyp') throw new Error(\`MP4 \u6587\u4EF6\u5934\u65E0\u6548\uFF1A\${path}\u3002\`);
    return null;
  }
  if (/\\.webm$/i.test(path)) {
    if (bytes.length < 16 || ![26, 69, 223, 163].every((value, index) => bytes[index] === value) || !ascii(0, Math.min(bytes.length, 4096)).includes('webm')) throw new Error(\`WebM \u6587\u4EF6\u5934\u65E0\u6548\uFF1A\${path}\u3002\`);
    return null;
  }
  if (bytes.length < 30 || ascii(0, 4) !== 'RIFF' || ascii(8, 12) !== 'WEBP') throw new Error(\`WebP \u6587\u4EF6\u5934\u65E0\u6548\uFF1A\${path}\u3002\`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let frames = 0, width = 0, height = 0, alpha = false;
  for (let at = 12; at + 8 <= bytes.length;) {
    const size = view.getUint32(at + 4, true);
    if (at + 8 + size > bytes.length) throw new Error(\`WebP \u5185\u5BB9\u4E0D\u5B8C\u6574\uFF1A\${path}\u3002\`);
    if (ascii(at, at + 4) === 'VP8X' && size >= 10) {
      alpha = Boolean(bytes[at + 8] & 16);
      width = 1 + bytes[at + 12] + (bytes[at + 13] << 8) + (bytes[at + 14] << 16);
      height = 1 + bytes[at + 15] + (bytes[at + 16] << 8) + (bytes[at + 17] << 16);
    }
    if (ascii(at, at + 4) === 'ANMF') frames++;
    at += 8 + size + (size % 2);
  }
  if (frames < 2 || frames > 600 || !width || !height || width > 2048 || height > 2048) throw new Error(\`WebP \u52A8\u4F5C\u9700\u4E3A 2 \u81F3 600 \u5E27\u3001\u5355\u5E27\u4E0D\u8D85\u8FC7 2048 \xD7 2048 \u7684\u52A8\u753B\uFF1A\${path}\u3002\`);
  if (needsAlpha && !alpha) throw new Error(\`WebP \u52A8\u4F5C\u6CA1\u6709\u900F\u660E\u901A\u9053\uFF1A\${path}\u3002\`);
  return { width, height, frames };
}

export function creationImageChecks(files, kind) {
  const info = inspectImportPackage(files, kind);
  if (kind === 'pet') {
    if (info.manifest.mediaVersion !== 1) return [{ path: info.assetPrefix + 'spritesheet.webp', width: 1536, height: info.manifest.spriteVersionNumber === 2 ? 2288 : 1872 }];
    return [...new Set(Object.values(info.manifest.actions))].filter(path => /\\.webp$/i.test(path)).map(path => ({ path: info.assetPrefix + path, ...mediaFileInfo(files[info.assetPrefix + path], path, info.manifest.background.mode === 'alpha') }));
  }
  return Object.values(info.manifest.assets?.sprites || {}).map(sprite => ({ path: info.assetPrefix + sprite.path, width: sprite.frameWidth * sprite.frames, height: sprite.frameHeight }));
}
`,type:"text/javascript; charset=utf-8"},"/native-package-contract.js":{body:'// \u7531\u684C\u9762\u73B0\u6709\u7EAF\u6E05\u5355\u4E0E\u52A8\u4F5C\u5951\u7EA6\u751F\u6210\uFF1B\u4F7F\u7528 build-native-contract.mjs \u66F4\u65B0\uFF0C\u4E0D\u590D\u5236\u9A8C\u8BC1\u89C4\u5219\u3002\nvar h=["idle","thinking","working","editing","running","testing","waiting","waving","success","error","celebrating"];var M=new Set(["$schema","manifestVersion","id","name","description","version","runtime","icon","permissions","configSchema","triggers"]),y=new Set(["$schema","manifestVersion","id","name","description","version","runtime","sdkVersion","entry","icon","permissions","network","configSchema"]),v=new Set([...y,"assets","panels"]),z=new Set(["type","label","description","default","options","presentation","min","max","step","maxLength","maxItems","itemSchema"]),F=new Set(["label","value","previewSprite"]),I=new Set(["on","everyMinutes","actions"]),L=new Set(["type","message"]),T=new Set(["type","reaction"]),B=new Set(["text","textarea","number","boolean","select","time","date","multiSelect","list","secret","sound"]),D=new Set(["multi-select","schedule","connection"]),G=new Set(["dynamicOptions"]),W=new Set(["plugin","bell","timer","github","heart","sparkles","coffee","focus","droplet"]),S=["pet:interact","pet:pin","pet:animate","pet:speak:dynamic","pet:drop","pets:read","pets:manage","audio","events","ui:toast","ui:panel","ui:delivery","ui:session","notify","bus","ai","secrets","voice:speak","voice:listen","auth","files","system:openExternal","system:metrics","clipboard","network:write","network:local"],H=["pet:speak","pet:reaction","pet:move","timer","schedule","storage","status","commands","network",...S],_=["pet:speak","pet:reaction","pet:move","schedule","storage","status","commands","network"],J=[..._,...S],K=new Set(H),U=new Set(["pet:speak","pet:reaction","timer"]),x=["icons","images","svgs","sprites","sounds"],A={icons:[".png",".webp",".svg"],images:[".png",".webp",".jpg",".jpeg",".gif"],svgs:[".svg"],sprites:[".webp"],sounds:[".ogg",".mp3",".wav"]},q={icons:256*1024,images:1024*1024,svgs:256*1024,sprites:5*1024*1024,sounds:1024*1024},Y=1024*1024,w=/^[a-z0-9][a-z0-9._-]{0,63}$/;function $(e){let t=[];if(!c(e))return{ok:!1,errors:[{path:"$",code:"invalid_manifest",message:"Plugin manifest must be a JSON object."}]};if(e.manifestVersion===2||e.manifestVersion===3)return Q(e,e.manifestVersion);f(e,M,"$",t),e.manifestVersion!==1&&o(t,"$.manifestVersion","invalid_manifest_version","manifestVersion must be 1, 2, or 3."),l(e.id,"$.id","id",t,/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/),l(e.name,"$.name","name",t),e.description!==void 0&&l(e.description,"$.description","description",t),l(e.version,"$.version","version",t,/^\\d+\\.\\d+\\.\\d+(?:[-+][0-9A-Za-z.-]+)?$/),V(e.icon,t),e.runtime==="javascript"?o(t,"$.runtime","unsupported_runtime",\'Runtime "javascript" is recognized but unsupported in manifest v1. Use "declarative".\'):e.runtime!=="declarative"&&o(t,"$.runtime","invalid_runtime",\'runtime must be "declarative".\');let n=C(e.permissions,t,U),i=P(e.configSchema,t);return fe(e.triggers,n,i,t),t.length>0?{ok:!1,errors:t}:{ok:!0,manifest:e,errors:[]}}function Z(e){if(!c(e))return $(e);let t=e.manifestVersion===3?v:e.manifestVersion===2?y:M;return $(Object.fromEntries(Object.entries(e).filter(([n])=>t.has(n))))}function Q(e,t){let n=[];return f(e,t===3?v:y,"$",n),l(e.id,"$.id","id",n,/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/),l(e.name,"$.name","name",n),e.description!==void 0&&l(e.description,"$.description","description",n),l(e.version,"$.version","version",n,/^\\d+\\.\\d+\\.\\d+(?:[-+][0-9A-Za-z.-]+)?$/),V(e.icon,n),e.runtime!=="javascript"&&o(n,"$.runtime","invalid_runtime",`manifestVersion ${t} runtime must be "javascript".`),l(e.sdkVersion,"$.sdkVersion","sdkVersion",n,/^\\d+\\.\\d+\\.\\d+(?:[-+][0-9A-Za-z.-]+)?$/),t===3&&typeof e.sdkVersion=="string"&&!e.sdkVersion.startsWith("3.")&&o(n,"$.sdkVersion","invalid_sdk_version","manifestVersion 3 requires sdkVersion 3.x.y."),se(e.entry,n),ee(e.permissions,t,n),P(e.configSchema,n,t),oe(e.network,e.permissions,n),t===3&&(te(e.assets,n),X(e.configSchema,e.assets,n),ie(e.panels,n)),n.length>0?{ok:!1,errors:n}:{ok:!0,manifest:e,errors:[]}}function X(e,t,n){if(!(!c(e)||!c(t)||!c(t.sprites))){for(let[i,s]of Object.entries(e))if(!(!c(s)||s.presentation!=="sprite-grid"||!Array.isArray(s.options)))for(let[a,r]of s.options.entries())(!c(r)||typeof r.previewSprite!="string"||!Object.prototype.hasOwnProperty.call(t.sprites,r.previewSprite))&&o(n,`$.configSchema.${i}.options[${a}].previewSprite`,"invalid_preview_sprite","sprite-grid options must reference a declared sprite.")}}function ee(e,t,n){let i=new Set(t===3?J:_),s=C(e,n);for(let a of s)i.has(a)||o(n,"$.permissions","invalid_permission",`Permission ${a} is not valid for manifestVersion ${t} javascript plugins.`);return s}function b(e,t,n,i){if(typeof e!="string"||e.trim()==="")return o(i,n,"invalid_asset_path","Asset path must be a non-empty string.");if(e.startsWith("/")||e.includes("\\\\")||e.split("/").includes("..")||e.split("/").includes("."))return o(i,n,"invalid_asset_path","Asset path must be a safe relative path.");t.some(s=>e.toLowerCase().endsWith(s))||o(i,n,"invalid_asset_format",`Asset must end with one of ${t.join(", ")}.`)}function te(e,t){if(e!==void 0){if(!c(e))return o(t,"$.assets","invalid_assets","assets must be an object.");f(e,new Set(x),"$.assets",t);for(let n of x){let i=e[n];if(i===void 0)continue;if(!c(i)){o(t,`$.assets.${n}`,"invalid_assets",`assets.${n} must be an object.`);continue}let s=Object.entries(i);s.length>64&&o(t,`$.assets.${n}`,"too_many_assets",`assets.${n} may declare at most 64 entries.`);for(let[a,r]of s){let d=`$.assets.${n}.${a}`;w.test(a)||o(t,d,"invalid_asset_name","Asset names must be simple lowercase identifiers."),n!=="sprites"?b(r,A[n],d,t):ne(r,d,t)}}}}function ne(e,t,n){if(!c(e)){o(n,t,"invalid_sprite","Sprite assets must declare path and frame metadata.");return}f(e,new Set(["path","frameWidth","frameHeight","frames","durationMs"]),t,n),b(e.path,A.sprites,`${t}.path`,n);for(let[i,s,a]of[["frameWidth",32,512],["frameHeight",32,512],["frames",1,16],["durationMs",100,4e3]])(typeof e[i]!="number"||!Number.isInteger(e[i])||e[i]<s||e[i]>a)&&o(n,`${t}.${i}`,"invalid_sprite_metadata",`${i} must be an integer between ${s} and ${a}.`)}function ie(e,t){if(e===void 0)return;if(!c(e))return o(t,"$.panels","invalid_panels","panels must be an object.");let n=Object.entries(e);n.length>8&&o(t,"$.panels","too_many_panels","panels may declare at most 8 entries.");for(let[i,s]of n){let a=`$.panels.${i}`;w.test(i)||o(t,a,"invalid_panel_name","Panel names must be simple lowercase identifiers."),b(s,[".html"],a,t)}}function V(e,t){e!==void 0&&(typeof e!="string"||!W.has(e))&&o(t,"$.icon","invalid_icon","icon must be one of plugin, bell, timer, github, heart, sparkles, coffee, focus, or droplet.")}function se(e,t){l(e,"$.entry","entry",t),typeof e=="string"&&(e.startsWith("/")||e.includes("\\\\")||e.split("/").includes("..")||!/\\.(?:mjs|js)$/.test(e))&&o(t,"$.entry","invalid_entry","entry must be a relative .js or .mjs path.")}function re(e){let t=e.toLowerCase();if(t==="localhost"||t.endsWith(".localhost"))return!0;let n=t.split(".");if(n.length!==4)return!1;let i=n.map(r=>/^\\d{1,3}$/.test(r)?Number(r):NaN);if(i.some(r=>!Number.isInteger(r)||r<0||r>255))return!1;let[s,a]=i;return s===10||s===127||s===0||s===169&&a===254||s===172&&a>=16&&a<=31||s===192&&a===168||s===100&&a>=64&&a<=127}function oe(e,t,n){if(e===void 0)return;if(!c(e)||!Array.isArray(e.hosts))return o(n,"$.network.hosts","invalid_network_hosts","network.hosts must be an array.");f(e,new Set(["hosts"]),"$.network",n);let i=Array.isArray(t)&&t.includes("network:local"),s=new Set;e.hosts.forEach((a,r)=>{let d=typeof a=="string"?a.split(":")[0]:"",u=typeof a=="string"&&re(d);typeof a!="string"||!/^[a-z0-9.-]+(?::\\d{1,5})?$/i.test(a)||a.includes("*")||a.trim()!==a?o(n,`$.network.hosts[${r}]`,"invalid_network_host","network hosts must be exact host names."):["169.254.169.254","metadata.google.internal","169.254.170.2","fd00:ec2::254"].includes(a.toLowerCase())?o(n,`$.network.hosts[${r}]`,"blocked_host","This host is unconditionally blocked for security reasons."):u&&!i?o(n,`$.network.hosts[${r}]`,"missing_local_network_permission",\'Local/private network hosts require the "network:local" permission.\'):u&&!/:\\d{1,5}$/.test(a)?o(n,`$.network.hosts[${r}]`,"missing_port","network:local hosts must include a port (e.g. \'127.0.0.1:8765\')."):s.has(a)&&o(n,`$.network.hosts[${r}]`,"duplicate_network_host","Duplicate network host."),s.add(String(a))})}function C(e,t,n=K){let i=new Set;return Array.isArray(e)?(e.forEach((s,a)=>{if(typeof s!="string"||!n.has(s)){o(t,`$.permissions[${a}]`,"invalid_permission",`Permission must be one of ${[...n].join(", ")}.`);return}if(i.has(s)){o(t,`$.permissions[${a}]`,"duplicate_permission",`Duplicate permission ${s}.`);return}i.add(s)}),i):(o(t,"$.permissions","invalid_permissions","permissions must be an array."),i)}function P(e,t,n=1){let i={text:new Set,select:new Set,number:new Set,schema:c(e)?e:{}};if(e===void 0)return i;if(!c(e))return o(t,"$.configSchema","invalid_config_schema","configSchema must be an object."),i;let s=new Set(["date","secret","sound"]);for(let[a,r]of Object.entries(e)){let d=`$.configSchema.${a}`;if(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(a)||o(t,d,"invalid_config_key","Config field keys must be simple identifiers."),!c(r)){o(t,d,"invalid_config_field","Config field must be an object.");continue}f(r,z,d,t);for(let g of G)Object.prototype.hasOwnProperty.call(r,g)&&o(t,`${d}.${g}`,"deferred_config_feature",`${g} is deferred and unsupported in v1.`);if(typeof r.type!="string"||!B.has(r.type)||n<3&&s.has(r.type)){let g=typeof r.type=="string"&&(D.has(r.type)||n<3&&s.has(r.type))?"deferred_config_type":"invalid_config_type";o(t,`${d}.type`,g,"Config field type is not supported for this manifest version.")}else ae(r,d,t,n),r.type==="number"&&i.number.add(a),r.type==="text"&&i.text.add(a),r.type==="select"&&i.select.add(a)}return i}function ae(e,t,n,i=1){e.label!==void 0&&l(e.label,`${t}.label`,"label",n),e.description!==void 0&&l(e.description,`${t}.description`,"description",n),e.type!=="select"&&e.type!=="multiSelect"&&e.options!==void 0&&o(n,`${t}.options`,"invalid_options","options are only valid for select config fields."),(e.type==="text"||e.type==="textarea")&&e.default!==void 0&&typeof e.default!="string"&&o(n,`${t}.default`,"invalid_default","Default must be a string."),e.type==="number"&&e.default!==void 0&&(typeof e.default!="number"||!Number.isFinite(e.default))&&o(n,`${t}.default`,"invalid_default","Default must be a finite number."),e.type==="boolean"&&e.default!==void 0&&typeof e.default!="boolean"&&o(n,`${t}.default`,"invalid_default","Default must be a boolean."),e.type==="time"&&e.default!==void 0&&(typeof e.default!="string"||!de(e.default))&&o(n,`${t}.default`,"invalid_default","Default must be HH:mm between 00:00 and 23:59."),e.type==="date"&&e.default!==void 0&&(typeof e.default!="string"||!/^\\d{4}-\\d{2}-\\d{2}$/.test(e.default))&&o(n,`${t}.default`,"invalid_default","Default must be YYYY-MM-DD."),e.type==="secret"&&e.default!==void 0&&o(n,`${t}.default`,"invalid_default","Secret config fields must not declare defaults."),e.presentation!==void 0&&(e.type!=="select"||e.presentation!=="sprite-grid")&&o(n,`${t}.presentation`,"invalid_presentation","sprite-grid presentation is only valid for select fields."),(e.type==="select"||e.type==="multiSelect")&&ce(e,t,n),e.type==="list"&&(e.maxItems!==void 0&&(typeof e.maxItems!="number"||!Number.isInteger(e.maxItems)||e.maxItems<0)&&o(n,`${t}.maxItems`,"invalid_max_items","maxItems must be a non-negative integer."),e.itemSchema!==void 0&&P(e.itemSchema,n,i))}function de(e){let t=/^(\\d{2}):(\\d{2})$/.exec(e);return!!t&&Number(t[1])<=23&&Number(t[2])<=59}function ce(e,t,n){if(!Array.isArray(e.options)||e.options.length===0){o(n,`${t}.options`,"invalid_options","select config fields must have non-empty options.");return}let i=le(e.options,t,n);e.default!==void 0&&(e.type==="multiSelect"?(!Array.isArray(e.default)||e.default.some(s=>typeof s!="string"||!i.has(s)))&&o(n,`${t}.default`,"invalid_default","Multi-select default must match option values."):typeof e.default!="string"?o(n,`${t}.default`,"invalid_default","Select default must be a string."):i.has(e.default)||o(n,`${t}.default`,"invalid_default","Select default must match one of the option values."))}function le(e,t,n){let i=new Set;return Array.isArray(e)?(e.forEach((s,a)=>{let r=`${t}.options[${a}]`;if(!c(s))return o(n,r,"invalid_option","Option must be an object.");f(s,F,r,n),l(s.label,`${r}.label`,"option label",n),l(s.value,`${r}.value`,"option value",n),s.previewSprite!==void 0&&(typeof s.previewSprite!="string"||!w.test(s.previewSprite))&&o(n,`${r}.previewSprite`,"invalid_preview_sprite","previewSprite must be a declared sprite name."),typeof s.value=="string"&&s.value.trim()!==""&&(i.has(s.value)&&o(n,`${r}.value`,"duplicate_option_value",`Duplicate option value ${s.value}.`),i.add(s.value))}),i):(o(n,`${t}.options`,"invalid_options","options must be an array."),i)}function fe(e,t,n,i){if(!Array.isArray(e))return o(i,"$.triggers","invalid_triggers","triggers must be an array.");e.forEach((s,a)=>{let r=`$.triggers[${a}]`;if(!c(s))return o(i,r,"invalid_trigger","Trigger must be an object.");if(f(s,I,r,i),s.on!=="timer"&&o(i,`${r}.on`,"invalid_trigger","Only timer triggers are supported in v1."),m(t,"timer",r,i),pe(s.everyMinutes,n.number,`${r}.everyMinutes`,i),!Array.isArray(s.actions))return o(i,`${r}.actions`,"invalid_actions","actions must be an array.");s.actions.forEach((d,u)=>ge(d,t,n,`${r}.actions[${u}]`,i))})}function pe(e,t,n,i){if(typeof e=="number"){(!Number.isInteger(e)||e<5)&&o(i,n,"invalid_timer_interval","Timer interval must be an integer of at least 5 minutes.");return}if(!c(e)||Object.keys(e).length!==1||!Object.prototype.hasOwnProperty.call(e,"config")||typeof e.config!="string"){o(i,n,"invalid_timer_interval","Timer interval must be an integer or { config: string }.");return}t.has(e.config)||o(i,`${n}.config`,"invalid_timer_config_reference","Timer config reference must point to a number config field.")}function k(e,t,n,i,s,a){if(typeof e=="string")return l(e,n,i,a);if(!c(e)||Object.keys(e).length!==1||!Object.prototype.hasOwnProperty.call(e,"config")||typeof e.config!="string"){o(a,n,"invalid_config_reference",`${i} must be a non-empty string or { config: string }.`);return}t.has(e.config)||o(a,`${n}.config`,"invalid_config_reference",`${i} config reference must point to a ${s} config field.`)}function ue(e,t,n,i){if(!Object.prototype.hasOwnProperty.call(e,t))return;let s=e[t];if(!c(s)||s.type!=="select")return;let a=new Set(h);if((!Object.prototype.hasOwnProperty.call(s,"default")||typeof s.default!="string"||!a.has(s.default))&&o(i,`${n}.config`,"invalid_reaction_config_reference","Reaction select config must have a valid OpenPets reaction default."),Array.isArray(s.options))for(let r of s.options)c(r)&&typeof r.value=="string"&&!a.has(r.value)&&o(i,`${n}.config`,"invalid_reaction_config_reference","Reaction select options must be valid OpenPets reactions.")}function ge(e,t,n,i,s){if(!c(e))return o(s,i,"invalid_action","Action must be an object.");e.type==="pet.speak"?(f(e,L,i,s),k(e.message,n.text,`${i}.message`,"message","text",s),m(t,"pet:speak",i,s)):e.type==="pet.react"?(f(e,T,i,s),k(e.reaction,n.select,`${i}.reaction`,"reaction","select",s),c(e.reaction)&&typeof e.reaction.config=="string"&&n.select.has(e.reaction.config)&&ue(n.schema,e.reaction.config,`${i}.reaction`,s),m(t,"pet:reaction",i,s)):o(s,`${i}.type`,"invalid_action","Action type must be pet.speak or pet.react.")}function m(e,t,n,i){e.has(t)||o(i,n,"missing_permission",`Missing required permission ${t}.`)}function f(e,t,n,i){for(let s of Object.keys(e))t.has(s)||o(i,`${n}.${s}`,"unknown_field",`Unknown field ${s}.`)}function l(e,t,n,i,s){if(typeof e!="string"||e.trim()==="")return o(i,t,"invalid_string",`${n} must be a non-empty string.`);s&&!s.test(e)&&o(i,t,"invalid_format",`${n} has an invalid format.`)}function o(e,t,n,i){e.push({path:t,code:n,message:i})}function c(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}var E=["idle","running-right","running-left","waving","jumping","failed","waiting","running","review"],O=["sleeping","clicked","dragged"];function me(e){return typeof e=="string"&&e.length<=240&&/\\.(?:mp4|webm|webp)$/i.test(e)&&e.split("/").every(t=>/^[\\p{L}\\p{N}][\\p{L}\\p{N} ._-]{0,79}$/u.test(t)&&!/[. ]$/.test(t)&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\\.|$)/i.test(t))}function ye(e){return typeof e=="string"&&/^[a-z0-9][a-z0-9_-]{0,63}$/.test(e)&&!["__proto__","constructor","prototype"].includes(e)}function we(e,t){if(!p(e)||e.mediaVersion!==1)throw new Error("\\u52A8\\u4F5C\\u5A92\\u4F53\\u5305\\u7684 mediaVersion \\u5FC5\\u987B\\u4E3A 1\\u3002");if(!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(t)||t==="builtin"||e.id!==t)throw new Error("\\u684C\\u5BA0\\u7F16\\u53F7\\u65E0\\u6548\\u6216\\u4E0E\\u7D20\\u6750\\u5305\\u4E0D\\u4E00\\u81F4\\u3002");if(typeof e.displayName!="string"||!e.displayName.trim()||e.displayName.length>80)throw new Error("\\u684C\\u5BA0\\u540D\\u79F0\\u65E0\\u6548\\u3002");if(typeof e.description!="string"||!e.description.trim()||e.description.length>500)throw new Error("\\u684C\\u5BA0\\u63CF\\u8FF0\\u65E0\\u6548\\u3002");if(!p(e.actions)||!Object.hasOwn(e.actions,"idle")||Object.keys(e.actions).length>128)throw new Error("\\u52A8\\u4F5C\\u5A92\\u4F53\\u5305\\u9700\\u8981 idle \\u5F85\\u673A\\u52A8\\u4F5C\\uFF0C\\u6700\\u591A\\u652F\\u6301 128 \\u4E2A\\u52A8\\u4F5C\\u3002");let n={};for(let[r,d]of Object.entries(e.actions)){if(!ye(r)||!me(d))throw new Error(`\\u52A8\\u4F5C ${r} \\u9700\\u8981\\u6709\\u6548\\u7F16\\u53F7\\u53CA\\u672C\\u5305\\u5185\\u7684 MP4\\u3001WebM \\u6216 WebP \\u6587\\u4EF6\\u3002`);n[r]=d}let i={};if(e.actionDefinitions!==void 0){if(!p(e.actionDefinitions))throw new Error("\\u52A8\\u4F5C\\u540D\\u79F0\\u4E0E\\u5206\\u7C7B\\u65E0\\u6548\\u3002");for(let[r,d]of Object.entries(e.actionDefinitions)){if(!Object.hasOwn(n,r)||!p(d)||typeof d.displayName!="string"||!d.displayName.trim()||d.displayName.length>80||d.category!==void 0&&(typeof d.category!="string"||!d.category.trim()||d.category.length>80))throw new Error("\\u52A8\\u4F5C\\u540D\\u79F0\\u4E0E\\u5206\\u7C7B\\u5FC5\\u987B\\u5BF9\\u5E94\\u5DF2\\u6709\\u52A8\\u4F5C\\uFF0C\\u4E14\\u4E0D\\u8D85\\u8FC7 80 \\u5B57\\u3002");i[r]={...d,displayName:d.displayName.trim(),...typeof d.category=="string"?{category:d.category.trim()}:{}}}}let s={};if(e.stateBindings!==void 0){if(!p(e.stateBindings))throw new Error("\\u72B6\\u6001\\u52A8\\u4F5C\\u7ED1\\u5B9A\\u65E0\\u6548\\u3002");for(let[r,d]of Object.entries(e.stateBindings)){if(![...E,...O].includes(r)||typeof d!="string"||!Object.hasOwn(n,d))throw new Error("\\u72B6\\u6001\\u7ED1\\u5B9A\\u5FC5\\u987B\\u5F15\\u7528\\u5DF2\\u58F0\\u660E\\u7684\\u52A8\\u4F5C\\u3002");s[r]=d}}if(e.staticActions!==void 0&&(!Array.isArray(e.staticActions)||e.staticActions.some(r=>typeof r!="string"||!Object.hasOwn(n,r))))throw new Error("\\u9759\\u6001\\u52A8\\u4F5C\\u5FC5\\u987B\\u5F15\\u7528\\u5DF2\\u58F0\\u660E\\u52A8\\u4F5C\\u3002");if(!p(e.background)||e.background.mode!=="alpha"&&e.background.mode!=="chroma")throw new Error("\\u8BF7\\u9009\\u62E9\\u900F\\u660E\\u901A\\u9053\\u6216\\u7EAF\\u8272\\u53BB\\u80CC\\u3002");let a;if(e.background.mode==="chroma"){let{color:r,tolerance:d}=e.background;if(typeof r!="string"||!/^#[0-9a-f]{6}$/i.test(r))throw new Error("\\u7EAF\\u8272\\u53BB\\u80CC\\u9700\\u8981\\u516D\\u4F4D\\u80CC\\u666F\\u989C\\u8272\\u3002");if(d!==void 0&&(!Number.isInteger(d)||d<10||d>160))throw new Error("\\u53BB\\u80CC\\u5BB9\\u5DEE\\u5FC5\\u987B\\u4E3A 10 \\u81F3 160\\u3002");a={...e.background,mode:"chroma",color:r.toLowerCase(),tolerance:typeof d=="number"?d:70}}else{if(Object.values(n).some(r=>r.toLowerCase().endsWith(".mp4")))throw new Error("MP4 \\u4E0D\\u542B\\u900F\\u660E\\u901A\\u9053\\uFF0C\\u8BF7\\u4F7F\\u7528\\u4E0D\\u4E0E\\u89D2\\u8272\\u914D\\u8272\\u51B2\\u7A81\\u7684\\u7EAF\\u8272\\u80CC\\u666F\\u5E76\\u58F0\\u660E\\u53BB\\u80CC\\u989C\\u8272\\u3002");a={...e.background,mode:"alpha"}}return{...e,id:t,displayName:e.displayName.trim(),description:e.description.trim(),mediaVersion:1,actions:n,background:a,...e.actionDefinitions!==void 0?{actionDefinitions:i}:{},...e.stateBindings!==void 0?{stateBindings:s}:{},...Array.isArray(e.staticActions)?{staticActions:e.staticActions}:{}}}function p(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}var Ve=128*1024,Ce=100*1024*1024,Ee=24*1024*1024;var j={version:1,frameWidth:192,frameHeight:208,columns:8,rows:9},be={version:2,frameWidth:192,frameHeight:208,columns:8,rows:11,neutralPose:{row:0,column:6}},Pe=16,Oe=Math.PI*2/Pe;function he(e,t){if(!R(t))throw new Error("Codex pet folder name is invalid.");if(!N(e))throw new Error("pet.json must be an object.");let n=xe(e);if(e.id!==t||typeof e.id!="string")throw new Error("Codex pet id must match its folder name.");if(!R(e.id))throw new Error("Codex pet id is invalid.");let i=Object.hasOwn(e,"displayName")?e.displayName:e.name;if(typeof i!="string"||i.trim().length===0||i.length>80)throw new Error("Codex pet displayName is invalid.");if(typeof e.description!="string"||e.description.trim().length===0||e.description.length>500)throw new Error("Codex pet description is invalid.");if(e.spritesheetPath!=="spritesheet.webp")throw new Error("Codex pet spritesheetPath must be spritesheet.webp.");return{id:e.id,displayName:i.trim(),description:e.description.trim(),spritesheetPath:"spritesheet.webp",...n.version===2?{spriteVersionNumber:2}:{}}}function xe(e){if(!N(e)||!Object.hasOwn(e,"spriteVersionNumber")||e.spriteVersionNumber===1)return j;if(e.spriteVersionNumber===2)return be;throw new Error("\\u684C\\u5BA0 spriteVersionNumber \\u5FC5\\u987B\\u662F\\u6570\\u5B57 1 \\u6216 2\\u3002")}function R(e){return/^[a-z0-9][a-z0-9_-]{0,63}$/.test(e)&&e!=="builtin"}function N(e){return typeof e=="object"&&e!==null}export{E as petMediaActions,O as petMediaOptionalActions,q as pluginAssetMaxBytes,Y as pluginPanelMaxBytes,he as validateCodexPetMetadata,Z as validateImportedPluginManifest,we as validateMediaPetMetadata};\n',type:"text/javascript; charset=utf-8"},"/plugin-covers.js":{body:`// \u63D2\u4EF6\u5361\u7247\u3001\u8BE6\u60C5\u4E0E\u6392\u884C\u699C\u4F7F\u7528\u540C\u4E00\u5957\u5C01\u9762\u3002
export const pluginCovers = Object.freeze({
  "openpets.reminders": "assets/plugin-covers/quick-reminder.webp",
  "openpets.simple-timer": "assets/plugin-covers/simple-timer.webp",
  "openpets.anxiety-aid-tools": "assets/plugin-covers/calm-practice.webp",
  "openpets.focus-buddy": "assets/plugin-covers/focus-buddy.webp",
  "openpets.launch-buddy": "assets/plugin-covers/launch-greeting.webp",
  "openpets.fortune-cookie": "assets/plugin-covers/fortune-cookie.webp",
  "openpets.virtual-pet": "assets/plugin-covers/virtual-pet.webp",
  "openpets.life-companion": "assets/plugin-covers/life-companion.webp",
  "openpets.water-reminder": "assets/plugin-covers/water-reminder.webp",
  "openpets.system-resources": "assets/plugin-covers/system-resources.webp",
  "openpets.calendar-airmail": "assets/plugin-covers/calendar-airmail.webp",
  "openpets.day-routine": "assets/plugin-covers/day-routine.webp",
  "openpets.magic-8-ball": "assets/plugin-covers/magic-ball.webp",
  "openpets.mood-check-in": "assets/plugin-covers/mood-check.webp",
  "regis.usage-buddy": "assets/plugin-covers/ai-allowance.webp",
  "openpets.higgsfield-watch": "assets/plugin-covers/generation-progress.webp",
  "openpets.drag-vocab": "assets/plugin-covers/drag-vocabulary.webp",
  "openpets.spotify-buddy": "assets/plugin-covers/music-buddy.webp",
  "openpets.walkabout": "assets/plugin-covers/desktop-walk.webp",
  "lingyin.file-assistant": "assets/plugin-covers/file-assistant.webp",
  "lingyin.computer-care": "assets/plugin-covers/computer-care.webp",
  "community.water-break": "assets/plugin-covers/water-break.webp",
  "community.eye-break": "assets/plugin-covers/eye-break.webp",
  "community.focus-break": "assets/plugin-covers/focus-break.webp"
});
`,type:"text/javascript; charset=utf-8"},"/publication-client.js":{body:`const communityId = /^community-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function text(value, label, maximum, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || value.length > maximum || /[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\p{Cf}]/u.test(value) || !optional && !value.trim()) throw new Error(\`\u516C\u5F00\u4F5C\u54C1\u7684\${label}\u683C\u5F0F\u65E0\u6548\u3002\`);
  return value;
}

export function configuredSubmissionRepository(configured, identity) {
  if (!configured) return '';
  const target = githubRepository(configured);
  if (identity?.submissionAvailable === true && githubRepository(identity.submissionRepository) !== target) throw new Error('\u6295\u7A3F\u4ED3\u5E93\u4E0E\u672C\u7AD9\u914D\u7F6E\u4E0D\u4E00\u81F4\u3002');
  return target;
}

function githubRepository(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('\u6295\u7A3F\u4ED3\u5E93\u5C1A\u672A\u914D\u7F6E\u3002'); }
  if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash || !/^\\/[A-Za-z0-9-]{1,39}\\/[A-Za-z0-9_.-]{1,100}\\/?$/.test(url.pathname)) throw new Error('\u6295\u7A3F\u4ED3\u5E93\u5730\u5740\u65E0\u6548\u3002');
  return \`\${url.origin}\${url.pathname.replace(/\\/$/, '')}\`;
}

export function githubSubmissionUrl(repository, metadata, archive, details = {}) {
  const url = new URL(\`\${githubRepository(repository)}/issues/new\`);
  const title = text(metadata.title, '\u540D\u79F0', 120), description = text(metadata.description, '\u8BF4\u660E', 1000);
  if (metadata.workflow === 'request') {
    const category = text(metadata.category, '\u5206\u7C7B', 80);
    if (![1, 2].includes(metadata.version)) throw new Error('\u5236\u4F5C\u9700\u6C42\u56FE\u96C6\u7248\u672C\u65E0\u6548\u3002');
    url.searchParams.set('title', \`[\u5236\u4F5C\u9700\u6C42] \${title}\`);
    url.searchParams.set('body', \`## \u5236\u4F5C\u9700\u6C42\\n\\n- \u540D\u79F0\uFF1A\${title}\\n- \u5206\u7C7B\uFF1A\${category}\\n- \u56FE\u96C6\u7248\u672C\uFF1AV\${metadata.version}\\n\\n## \u5236\u4F5C\u8BF4\u660E\\n\\n\${description}\\n\\n\u63D0\u4EA4\u540E\u5F85\u7EF4\u62A4\u8005\u5904\u7406\uFF0C\u6B64\u7533\u8BF7\u672A\u81EA\u52A8\u5728\u7F51\u7AD9\u53D1\u5E03\u3002\`);
    return url.href;
  }
  if (!['pet-make', 'pet-import', 'plugin-make', 'plugin-import'].includes(metadata.workflow)) throw new Error('\u6295\u7A3F\u4F5C\u54C1\u7C7B\u578B\u65E0\u6548\u3002');
  const pet = metadata.workflow.startsWith('pet-');
  const id = text(metadata.id, '\u4F5C\u54C1\u7F16\u53F7', 160), author = text(metadata.author, '\u4F5C\u8005', 120), license = text(metadata.license, '\u8BB8\u53EF', 200);
  const file = text(archive?.name, '\u5206\u4EAB\u5305\u540D\u79F0', 180);
  if (!Number.isSafeInteger(archive.bytes) || archive.bytes < 1 || !/^[a-f0-9]{64}$/.test(archive.sha256)) throw new Error('\u5206\u4EAB\u5305\u6458\u8981\u65E0\u6548\u3002');
  url.searchParams.set('template', pet ? 'pet-submission.yml' : 'plugin-submission.yml');
  url.searchParams.set('title', \`[\${pet ? '\u684C\u5BA0' : '\u63D2\u4EF6'}\u6295\u7A3F] \${title}\`);
  url.searchParams.set('work_name', title);
  url.searchParams.set('author', author);
  url.searchParams.set('description', description);
  url.searchParams.set('license', license);
  const attachment = archive.bytes > 25 * 1024 * 1024 ? \`\u5DF2\u751F\u6210\u7684 \${file} \u8D85\u8FC7 GitHub Issue \u9644\u4EF6\u4E0A\u9650\uFF0C\u8BF7\u6309\u4ED3\u5E93\u6295\u7A3F\u6307\u5357\u901A\u8FC7 PR \u63D0\u4EA4\u5B8C\u6574\u5305\u540E\u7C98\u8D34\u94FE\u63A5\u3002\` : \`\u8BF7\u5C06\u5DF2\u751F\u6210\u7684 \${file} \u62D6\u5165\u6B64\u5904\uFF0C\u6216\u6309\u4ED3\u5E93\u6295\u7A3F\u6307\u5357\u63D0\u4EA4 PR \u540E\u7C98\u8D34\u94FE\u63A5\u3002\`;
  url.searchParams.set('files', \`\${attachment}\\n\\n\u4F5C\u54C1ID\uFF1A\${id}\\n\u5171\u521B\u5165\u53E3\uFF1A\${metadata.workflow.endsWith('make') ? '\u5236\u4F5C' : '\u5BFC\u5165'}\${pet ? '\u684C\u5BA0' : '\u63D2\u4EF6'}\\n\u5305\u5927\u5C0F\uFF1A\${archive.bytes} \u5B57\u8282\\nSHA-256\uFF1A\${archive.sha256}\\n\\n\u6295\u7A3F\u7B49\u5F85\u5BA1\u6838\u6536\u5F55\uFF1B\u63D0\u4EA4\u4E0D\u4EE3\u8868\u81EA\u52A8\u4E0A\u7EBF\u3002\`);
  if (pet) {
    url.searchParams.set('actions', text(details.actions || '\u52A8\u4F5C\u4E0E\u540D\u79F0\u4EE5\u6240\u9644\u5B8C\u6574\u6E05\u5355\u548C\u7D20\u6750\u4E3A\u51C6\u3002', '\u52A8\u4F5C\u8BF4\u660E', 3000));
    url.searchParams.set('environment', text(details.environment || 'desktop pet\uFF1B\u5236\u4F5C\u5305\u6309\u672C\u7CFB\u7EDF\u89C4\u8303\uFF0C\u5BFC\u5165\u5305\u4FDD\u7559\u539F\u9879\u76EE\u903B\u8F91\u3002', '\u8FD0\u884C\u8BF4\u660E', 2000));
  } else {
    url.searchParams.set('version', text(details.version || '\u539F\u6E05\u5355\u672A\u58F0\u660E\u7248\u672C', '\u7248\u672C', 120));
    url.searchParams.set('permissions', text(details.permissions || '\u6743\u9650\u4EE5\u6240\u9644\u539F\u6E05\u5355\u4E3A\u51C6\uFF1B\u7F51\u9875\u672A\u6267\u884C\u4E0A\u4F20\u4EE3\u7801\u3002', '\u6743\u9650\u8BF4\u660E', 2000));
  }
  return url.href;
}

export function publicPluginItem(input) {
  if (!input || typeof input !== 'object' || !communityId.test(input.id)) throw new Error('\u516C\u5F00\u63D2\u4EF6\u7F16\u53F7\u65E0\u6548\u3002');
  const download = \`/api/plugins/\${input.id}/download\`;
  const cover = \`/api/plugins/\${input.id}/cover\`;
  if (input.download !== download || input.cover !== null && input.cover !== undefined && input.cover !== cover) throw new Error('\u516C\u5F00\u63D2\u4EF6\u6587\u4EF6\u5730\u5740\u65E0\u6548\u3002');
  return {
    id: input.id, kind: 'plugin', pluginType: input.pluginType === 'host-tool' ? 'host-tool' : 'community-plugin',
    title: text(input.title || input.name, '\u540D\u79F0', 120), description: text(input.description, '\u8BF4\u660E', 1000),
    author: text(input.author, '\u4F5C\u8005', 120), license: text(input.license, '\u8BB8\u53EF', 200), source: text(input.source, '\u6765\u6E90', 1000, true),
    hostNotice: text(input.hostNotice, '\u5B89\u88C5\u8BF4\u660E', 2000, true),
    features: Array.isArray(input.features) ? input.features.slice(0, 20).map(value => text(value, '\u529F\u80FD', 1000)) : [],
    permissions: [], permissionLabels: [], tags: ['\u793E\u533A\u4F5C\u54C1'], category: '\u793E\u533A\u4F5C\u54C1', symbol: '\u2726', cover: input.cover || null, download,
  };
}

export function publicPetItem(input) {
  if (!input || !communityId.test(input.id)) throw new Error('\u516C\u5F00\u684C\u5BA0\u7F16\u53F7\u65E0\u6548\u3002');
  const base = \`/api/pets/\${input.id}\`;
  if (input.download !== \`\${base}/download\` || ![\`\${base}/cover\`, 'assets/brand-logo.png'].includes(input.thumbnail) || input.atlas && input.atlas !== \`\${base}/media/atlas\`) throw new Error('\u516C\u5F00\u684C\u5BA0\u5730\u5740\u65E0\u6548\u3002');
  const mediaActions = {};
  const entries = Object.entries(input.mediaActions || {});
  if (entries.length > 128) throw new Error('\u516C\u5F00\u684C\u5BA0\u52A8\u4F5C\u8D85\u8FC7 128 \u4E2A\u3002');
  for (const [id, entry] of entries) {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id) || entry.url !== \`\${base}/media/\${id}\` || !['video/mp4', 'video/webm', 'image/webp'].includes(entry.type)) throw new Error('\u516C\u5F00\u684C\u5BA0\u52A8\u4F5C\u65E0\u6548\u3002');
    mediaActions[id] = { url: entry.url, type: entry.type, displayName: text(entry.displayName, '\u52A8\u4F5C\u540D\u79F0', 80) };
  }
  return { id: input.id, kind: 'pet', title: text(input.title, '\u540D\u79F0', 120), description: text(input.description, '\u8BF4\u660E', 1000), author: text(input.author, '\u4F5C\u8005', 120), license: text(input.license, '\u8BB8\u53EF', 200), thumbnail: input.thumbnail, atlas: input.atlas || null, version: input.version === 2 ? 2 : 1, mediaActions, download: input.download, category: '\u793E\u533A\u4F5C\u54C1', tags: ['\u793E\u533A\u4F5C\u54C1'], hostNotice: text(input.hostNotice, '\u5B89\u88C5\u8BF4\u660E', 2000, true) };
}

export function publicActivity(input) {
  if (input?.scope !== 'site' || !input.items || typeof input.items !== 'object' || Array.isArray(input.items)) throw new Error('\u516C\u5171\u4E92\u52A8\u6570\u636E\u65E0\u6548\u3002');
  const items = Object.create(null);
  for (const [id, entry] of Object.entries(input.items)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id) || !entry || ['likes', 'downloads', 'weekly'].some(key => !Number.isSafeInteger(entry[key]) || entry[key] < 0) || typeof entry.liked !== 'boolean') throw new Error('\u516C\u5171\u4E92\u52A8\u8BB0\u5F55\u65E0\u6548\u3002');
    for (const key of ['weeklyDownloads', 'weeklyLikes']) if (entry[key] !== undefined && (!Number.isSafeInteger(entry[key]) || entry[key] < 0)) throw new Error('\u516C\u5171\u6BCF\u5468\u4E92\u52A8\u8BB0\u5F55\u65E0\u6548\u3002');
    items[id] = { likes: entry.likes, downloads: entry.downloads, weekly: entry.weekly, liked: entry.liked, scope: 'site' };
    for (const key of ['weeklyDownloads', 'weeklyLikes']) if (entry[key] !== undefined) items[id][key] = entry[key];
  }
  return items;
}

export function publicContributorFollowers(input) {
  if (input === undefined) return null;
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length > 3000) throw new Error('\u8D21\u732E\u8005\u7EDF\u8BA1\u65E0\u6548\u3002');
  const result = new Map();
  for (const [author, entry] of Object.entries(input)) {
    text(author, '\u4F5C\u8005', 120);
    if (!Number.isSafeInteger(entry?.followers) || entry.followers < 0) throw new Error('\u8D21\u732E\u8005\u5173\u6CE8\u6570\u91CF\u65E0\u6548\u3002');
    result.set(author, entry.followers);
  }
  return result;
}

export function createPluginPublicationClient(request = globalThis.fetch.bind(globalThis)) {
  async function responseData(response) {
    let data;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok) {
      const error = new Error(typeof data?.error === 'string' ? data.error.slice(0, 500) : \`\u53D1\u5E03\u670D\u52A1\u8FD4\u56DE \${response.status}\u3002\`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  return {
    async session() {
      const response = await request('/api/session', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.status === 404) return { available: false, interactionsAvailable: false, anonymousInteractions: false, signedIn: false, maxPackageBytes: 0 };
      const data = await responseData(response);
      if (typeof data?.available !== 'boolean' || typeof data.signedIn !== 'boolean' || !Number.isSafeInteger(data.maxPackageBytes) || data.maxPackageBytes < (data.available ? 1 : 0) || data.maxPackageBytes > 32 * 1024 * 1024 || ['interactionsAvailable', 'anonymousInteractions', 'submissionAvailable'].some(key => data[key] !== undefined && typeof data[key] !== 'boolean')) throw new Error('\u53D1\u5E03\u670D\u52A1\u8EAB\u4EFD\u4FE1\u606F\u65E0\u6548\u3002');
      if (data.submissionAvailable === true) githubRepository(data.submissionRepository);
      return { ...data, interactionsAvailable: data.interactionsAvailable ?? data.available, anonymousInteractions: data.anonymousInteractions === true };
    },
    async list(kind = 'plugin') {
      const response = await request(\`/api/\${kind === 'pet' ? 'pets' : 'plugins'}\`, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.status === 404) return [];
      const data = await responseData(response);
      if (!Array.isArray(data?.items) || data.items.length > 1000) throw new Error('\u516C\u5F00\u63D2\u4EF6\u5217\u8868\u65E0\u6548\u3002');
      return data.items.map(kind === 'pet' ? publicPetItem : publicPluginItem);
    },
    async publish(metadata, archive, cover) {
      if (!['plugin-make', 'plugin-import', 'pet-make', 'pet-import'].includes(metadata.workflow)) throw new Error('\u8BF7\u9009\u62E9\u4F5C\u54C1\u5236\u4F5C\u6216\u5BFC\u5165\u5165\u53E3\u3002');
      const kind = metadata.workflow.startsWith('pet-') ? 'pet' : 'plugin';
      const payload = new FormData();
      payload.append('metadata', JSON.stringify(metadata));
      payload.append('package', archive, 'plugin-share.zip');
      if (cover) payload.append('cover', new Blob([cover.bytes], { type: cover.mime }), \`cover.\${cover.extension || 'png'}\`);
      const response = await request(\`/api/\${kind}s\`, { method: 'POST', credentials: 'same-origin', body: payload, headers: { Accept: 'application/json' } });
      const data = await responseData(response);
      if (![200, 201].includes(response.status)) throw new Error('\u53D1\u5E03\u670D\u52A1\u6CA1\u6709\u786E\u8BA4\u4F5C\u54C1\u5DF2\u4FDD\u5B58\u3002');
      return kind === 'pet' ? publicPetItem(data?.item) : publicPluginItem(data?.item);
    },
    async activity() { return publicActivity(await responseData(await request('/api/activity', { credentials: 'same-origin', cache: 'no-store' }))); },
    async activitySnapshot() {
      const data = await responseData(await request('/api/activity', { credentials: 'same-origin', cache: 'no-store' }));
      return { items: publicActivity(data), contributors: publicContributorFollowers(data.contributors) };
    },
    async like(id, liked) { if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(id) || typeof liked !== 'boolean') throw new Error('\u70B9\u8D5E\u53C2\u6570\u65E0\u6548\u3002'); return publicActivity(await responseData(await request(\`/api/works/\${id}/like\`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ liked }) }))); },
    async requests() {
      const data = await responseData(await request('/api/requests', { credentials: 'same-origin', cache: 'no-store' }));
      if (!Array.isArray(data?.items) || data.items.length > 1000) throw new Error('\u9700\u6C42\u5217\u8868\u65E0\u6548\u3002');
      return data.items.map(publicRequestItem);
    },
    async publishRequest(input) { const data = await responseData(await request('/api/requests', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })); return publicRequestItem(data?.item); },
    async contributor(author, kind = 'pets') {
      const path = contributorEndpoint(author, kind);
      const response = await request(path, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.status === 404 || response.status === 501) return { available: false, followers: null, following: false };
      return contributorState(await responseData(response));
    },
    async followContributor(author, kind, following) {
      if (typeof following !== 'boolean') throw new Error('\u5173\u6CE8\u53C2\u6570\u65E0\u6548\u3002');
      return contributorState(await responseData(await request(contributorEndpoint(author, kind), { method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ following }) })));
    },
  };
}

function contributorEndpoint(author, kind) {
  text(author, '\u4F5C\u8005', 120);
  if (!['pets', 'plugins'].includes(kind)) throw new Error('\u4F5C\u8005\u4F5C\u54C1\u7C7B\u578B\u65E0\u6548\u3002');
  return \`/api/contributors/\${encodeURIComponent(author)}?kind=\${kind}\`;
}

function contributorState(input) {
  if (input?.available !== true || !Number.isSafeInteger(input.followers) || input.followers < 0 || typeof input.following !== 'boolean') throw new Error('\u4F5C\u8005\u5173\u6CE8\u4FE1\u606F\u65E0\u6548\u3002');
  return { available: true, followers: input.followers, following: input.following };
}

function publicRequestItem(input) {
  if (!input || !/^request-[a-f0-9-]{36}$/.test(input.id) || ![1, 2].includes(input.version)) throw new Error('\u516C\u5F00\u9700\u6C42\u65E0\u6548\u3002');
  return { id: input.id, title: text(input.title, '\u540D\u79F0', 80), description: text(input.description, '\u8BF4\u660E', 1000), category: text(input.category, '\u5206\u7C7B', 80), version: input.version, createdAtISO: text(input.createdAtISO, '\u65F6\u95F4', 40), status: 'waiting', public: true };
}
`,type:"text/javascript; charset=utf-8"},"/publication-config.js":{body:`// \u7531\u672C\u7AD9\u90E8\u7F72\u6D41\u7A0B\u586B\u5199\uFF1B\u672C\u673A\u9884\u89C8\u4E0D\u628A\u6587\u4EF6\u81EA\u52A8\u4E0A\u4F20\u5230\u5176\u4ED6\u7AD9\u70B9\u3002
export const publicSiteUrl = '';
// \u521B\u5EFA\u5E76\u6838\u5B9E\u672C\u7AD9\u81EA\u6709\u6295\u7A3F\u4ED3\u5E93\u540E\u586B\u5199\uFF0C\u4E0D\u5411\u4E0A\u6E38\u4ED3\u5E93\u6295\u7A3F\u3002
export const submissionRepository = 'https://github.com/xunguangzlj-cloud/desktop-pet-community';
`,type:"text/javascript; charset=utf-8"},"/":{body:`<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="\u6D4F\u89C8\u684C\u5BA0\u4E0E\u63D2\u4EF6\uFF0C\u9884\u89C8\u52A8\u4F5C\uFF0C\u5236\u4F5C\u517C\u5BB9 desktop pet \u7684\u7D20\u6750\u5305\u3002AI \u6765\u6E90\u5728\u672C\u673A\u81EA\u884C\u914D\u7F6E\u3002">
  <meta name="color-scheme" content="light dark">
  <title>desktop pet \xB7 \u5E7F\u573A\u4E0E\u5236\u4F5C\u5DE5\u4F5C\u53F0</title>
  <link rel="icon" type="image/png" href="assets/brand-logo.png">
  <link rel="stylesheet" href="style.css">
  <script type="module" src="app.js"><\/script>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#pets"><img class="brand-mark" src="assets/brand-logo.png" width="36" height="36" alt="">desktop pet<span class="beta">\u9884\u89C8\u7248</span></a>
    <nav aria-label="\u7F51\u7AD9\u5BFC\u822A">
      <a href="#pets" data-route="pets">\u684C\u5BA0\u5E7F\u573A</a>
      <a href="#requests" data-route="requests">\u9700\u6C42\u5E7F\u573A</a>
      <a href="#plugins" data-route="plugins">\u63D2\u4EF6\u5E7F\u573A</a>
      <a href="#create" data-route="create">\u5171\u521B\u5E73\u53F0</a>
      <a href="#guide" data-route="guide">\u5B89\u88C5\u6307\u5357</a>
    </nav>
    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="\u5207\u6362\u6DF1\u8272\u4E3B\u9898" title="\u5207\u6362\u4E3B\u9898"><span aria-hidden="true">\u263C</span></button>
  </header>
  <main id="main">
    <div id="community-home">
      <section class="home-hero" aria-labelledby="home-title">
        <div class="home-hero-copy">
          <p class="home-badge"><span class="home-badge-dot" aria-hidden="true"></span><span id="home-collected-count">\u793E\u533A\u5171\u521B \xB7 \u6301\u7EED\u6536\u5F55</span></p>
          <h1 id="home-title" class="home-title"><span>\u5171\u521B\u5E73\u53F0</span></h1>
          <div class="home-stats" aria-label="\u5E7F\u573A\u6536\u5F55\u4FE1\u606F">
            <div class="home-stat"><strong id="home-pet-count">\u2014</strong><span>\u4F5C\u54C1\u6536\u5F55</span></div>
            <div class="home-stat"><strong id="home-category-count">\u2014</strong><span>\u5206\u7C7B\u6570</span></div>
          </div>
        </div>
        <div id="hero-pets" class="home-pet-strip" aria-label="\u7CBE\u9009\u684C\u5BA0"></div>
      </section>
      <section id="home-rankings" class="home-section home-rankings" aria-labelledby="home-rankings-title">
        <div class="home-ranking-heading">
          <p class="home-eyebrow">\u672C\u5468</p>
          <h2 id="home-rankings-title">\u793E\u533A\u6392\u884C\u699C</h2>
          <p class="home-scope" data-activity-scope>\u8FD1 7 \u65E5 \xB7 \u672C\u6D4F\u89C8\u5668</p>
          <a class="home-section-link" href="#rankings">\u699C\u5355 <span aria-hidden="true">\u2192</span></a>
        </div>
        <div class="home-ranking-columns">
          <div><h3 class="home-ranking-label">\u684C\u5BA0 \xB7 \u8FD1 7 \u65E5\u4E92\u52A8</h3><ol id="home-pet-ranking" class="community-ranking-list"></ol></div>
          <div><h3 class="home-ranking-label">\u4F5C\u8005 \xB7 \u672C\u7AD9\u6536\u5F55</h3><ol id="home-author-ranking" class="community-ranking-list"></ol></div>
        </div>
      </section>
      <section id="home-requests" class="home-section" aria-labelledby="home-requests-title">
        <div class="home-section-heading">
          <div><p class="home-eyebrow">\u7B49\u5F85\u5236\u4F5C</p><h2 id="home-requests-title">\u8FD9\u4E9B\u5C0F\u5BA0\u7269\u8FD8\u5728\u7B49\u4EBA\u5236\u4F5C</h2></div>
          <a class="home-section-link" href="#requests">\u8FDB\u5165\u9700\u6C42\u5E7F\u573A <span aria-hidden="true">\u2192</span></a>
        </div>
        <p class="home-scope home-request-scope">\u516C\u5F00\u9700\u6C42\u4E0E\u521B\u4F5C\u63D0\u6848\uFF1B\u8349\u7A3F\u3001\u652F\u6301\u4E0E\u5173\u6CE8\u4FDD\u5B58\u5728\u6B64\u6D4F\u89C8\u5668\u3002</p>
        <div id="request-preview" class="home-request-strip"></div>
      </section>
      <section id="home-collections" class="home-section" aria-labelledby="home-collections-title">
        <div class="home-section-heading">
          <div><p class="home-eyebrow">\u7CBE\u9009\u5408\u96C6</p><h2 id="home-collections-title">\u503C\u5F97\u4E00\u8D77\u5B89\u88C5\u7684\u7CBE\u9009\u7EC4\u5408</h2></div>
          <a class="home-section-link" href="#collections">\u67E5\u770B\u5168\u90E8</a>
        </div>
        <div class="home-collection-carousel">
          <button id="collection-prev" class="home-carousel-control home-carousel-prev" type="button" aria-label="\u4E0A\u4E00\u7EC4\u5408\u96C6">\u2039</button>
          <div id="collection-preview" class="home-collection-strip"></div>
          <button id="collection-next" class="home-carousel-control home-carousel-next" type="button" aria-label="\u4E0B\u4E00\u7EC4\u5408\u96C6">\u203A</button>
        </div>
      </section>
    </div>
    <section id="plugin-rankings" class="home-section home-rankings" aria-labelledby="plugin-rankings-title" hidden>
      <div class="home-ranking-heading"><p class="home-eyebrow">\u672C\u5468</p><h2 id="plugin-rankings-title">\u63D2\u4EF6\u6392\u884C\u699C</h2><p class="home-scope" data-activity-scope>\u8FD1 7 \u65E5 \xB7 \u672C\u6D4F\u89C8\u5668</p><a class="home-section-link" href="#rankings/plugins">\u699C\u5355 \u2192</a></div>
      <div class="home-ranking-columns"><div><h3 class="home-ranking-label">\u63D2\u4EF6 \xB7 \u8FD1 7 \u65E5\u4E92\u52A8</h3><ol id="home-plugin-ranking" class="community-ranking-list"></ol></div><div><h3 class="home-ranking-label">\u4F5C\u8005 / \u7EF4\u62A4\u8005 \xB7 \u672C\u7AD9\u6536\u5F55</h3><ol id="home-plugin-author-ranking" class="community-ranking-list"></ol></div></div>
    </section>
    <section id="gallery-view">
      <div class="gallery-header">
        <div class="gallery-title-group">
          <h1 id="gallery-title">\u684C\u5BA0\u5E7F\u573A</h1>
          <p id="gallery-total">\u6B63\u5728\u8BFB\u53D6\u4F5C\u54C1\u2026</p>
        </div>
        <div class="gallery-controls-group">
          <p id="gallery-status" class="gallery-status" aria-live="polite">\u70B9\u8D5E\u3001\u4E0B\u8F7D\u4E0E\u8FD1\u671F\u8D8B\u52BF\u4EC5\u8BB0\u5F55\u5728\u6B64\u6D4F\u89C8\u5668\uFF0C\u4E0D\u4EE3\u8868\u5168\u7AD9\u7EDF\u8BA1\u3002</p>
          <div class="gallery-controls">
            <button id="gallery-random" class="secondary" type="button"><span aria-hidden="true">\u2684</span>\u968F\u673A\u53D1\u73B0</button>
            <label class="sort-label"><span class="sr-only">\u5E7F\u573A\u6392\u5E8F</span><select id="sort"><option value="random">\u968F\u673A</option><option value="downloads" title="\u6309\u6B64\u6D4F\u89C8\u5668\u53D1\u8D77 ZIP \u4E0B\u8F7D\u7684\u6B21\u6570\u6392\u5E8F">\u6700\u591A\u4E0B\u8F7D</option><option value="likes">\u6700\u591A\u70B9\u8D5E</option><option value="trending">\u8FD1\u671F\u8D8B\u52BF</option><option value="name">\u540D\u79F0\uFF08A \u2192 Z\uFF09</option></select></label>
          </div>
        </div>
      </div>
      <h2 id="catalog-title" class="sr-only">\u684C\u5BA0\u4F5C\u54C1</h2>
      <div class="gallery-toolbar">
        <label class="search"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg><input id="search" type="search" placeholder="\u641C\u7D22\u684C\u5BA0\u3001\u4F5C\u8005\u3001\u6807\u7B7E\u2026" aria-label="\u641C\u7D22\u5E7F\u573A"><kbd aria-hidden="true">/</kbd></label>
      </div>
      <div class="category-bar" role="group" aria-label="\u7B5B\u9009\u5206\u7C7B"></div>
      <div id="cards" class="gallery-grid"></div>
      <div id="empty" class="empty" hidden><h2>\u6682\u65F6\u6CA1\u6709\u5339\u914D\u7684\u4F5C\u54C1</h2><p>\u6362\u4E00\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u8005\u628A\u5B83\u53D8\u6210\u4F60\u7684\u4E0B\u4E00\u4E2A\u4F5C\u54C1\u3002</p><button id="clear-search" class="secondary" type="button">\u6E05\u9664\u7B5B\u9009</button></div>
      <div class="gallery-pagination"><p id="result-count" class="result-count" aria-live="polite"></p><button id="gallery-more" class="secondary" type="button" hidden>\u52A0\u8F7D\u66F4\u591A</button></div>
    </section>
    <section id="rankings-view" class="community-page" hidden>
      <div class="ranking-page-heading"><div><p class="home-eyebrow">\u53D1\u73B0\u793E\u533A\u4F5C\u54C1</p><h1>\u793E\u533A\u6392\u884C\u699C</h1><p id="ranking-scope" class="community-scope">\u6B63\u5728\u8BFB\u53D6\u4E92\u52A8\u8BB0\u5F55\u3002</p></div><dl class="ranking-snapshot"><div><dt>\u7EDF\u8BA1\u5FEB\u7167</dt><dd id="ranking-snapshot">\u2014</dd></div><div><dt>\u66F4\u65B0\u9891\u7387</dt><dd id="ranking-refresh">\u9875\u9762\u8BFB\u53D6\u65F6\u66F4\u65B0</dd></div></dl></div>
      <div id="ranking-kinds" class="community-filter ranking-kinds" role="group" aria-label="\u4F5C\u54C1\u7C7B\u578B"><button type="button" data-ranking-kind="pets" aria-pressed="true">\u684C\u5BA0\u699C\u5355</button><button type="button" data-ranking-kind="plugins" aria-pressed="false">\u63D2\u4EF6\u699C\u5355</button></div>
      <div class="ranking-controls">
        <div id="ranking-tabs" class="ranking-view-tabs" role="tablist" aria-label="\u699C\u5355\u7C7B\u578B"><button type="button" role="tab" data-ranking-view="works" aria-selected="true">\u4F5C\u54C1</button><button type="button" role="tab" data-ranking-view="authors" aria-selected="false">\u8D21\u732E\u8005</button><button type="button" role="tab" data-ranking-view="collections" aria-selected="false">\u7CFB\u5217</button></div>
        <div id="ranking-period-buttons" class="community-filter" role="group" aria-label="\u65F6\u95F4\u8303\u56F4"><button type="button" data-ranking-period="week" aria-pressed="true">\u672C\u5468</button><button type="button" data-ranking-period="all" aria-pressed="false">\u603B\u699C</button></div><select id="ranking-period" hidden aria-label="\u65F6\u95F4\u8303\u56F4"><option value="week">\u672C\u5468</option><option value="all">\u603B\u699C</option></select>
      </div>
      <ol id="ranking-list" class="community-ranking-list community-ranking-page-list"></ol>
    </section>
    <section id="contributors-view" class="community-page" hidden>
      <a id="contributor-back" class="community-back" href="#rankings/authors">\u2190 \u8FD4\u56DE\u699C\u5355</a>
      <div class="contributor-heading"><div class="contributor-introduction"><p class="home-eyebrow">\u793E\u533A\u521B\u4F5C\u8005</p><h1 id="contributor-name"></h1><p id="contributor-handle" class="contributor-handle"></p><p id="contributor-description" class="community-scope"></p><div class="contributor-actions"><button id="contributor-follow" class="primary" type="button" disabled>\u5173\u6CE8</button><a id="contributor-homepage" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u4F5C\u8005\u4E3B\u9875 \u2197</a><button id="contributor-homepage-unavailable" class="secondary" type="button" disabled>\u4F5C\u8005\u4E3B\u9875</button></div><p id="contributor-follow-status" class="contributor-service-status" aria-live="polite"></p></div><dl class="contributor-statistics"><div><dd id="contributor-work-count">\u2014</dd><dt>\u4F5C\u54C1</dt></div><div><dd id="contributor-followers">\u2014</dd><dt>\u5173\u6CE8\u8005</dt></div><div><dd id="contributor-downloads">\u2014</dd><dt>\u4E0B\u8F7D</dt></div><div><dd id="contributor-likes">\u2014</dd><dt>\u70B9\u8D5E</dt></div></dl></div>
      <div class="contributor-works-heading"><h2 id="contributor-works-title">\u4F5C\u8005\u7684\u4F5C\u54C1</h2><div id="contributor-kind-tabs" class="community-filter" role="group" aria-label="\u4F5C\u8005\u4F5C\u54C1\u7C7B\u578B"></div></div><p id="contributor-statistics-scope" class="community-scope"></p><div id="contributor-works" class="gallery-grid"></div>
    </section>
    <section id="collections-view" class="community-page" hidden>
      <div class="community-page-heading"><p class="home-eyebrow">\u7CBE\u9009\u5408\u96C6</p><h1>\u627E\u5230\u503C\u5F97\u4E00\u8D77\u5B89\u88C5\u7684\u4F19\u4F34</h1><p class="community-scope">\u6309\u4F5C\u54C1\u7CFB\u5217\u6216\u5171\u540C\u4E3B\u9898\u6D4F\u89C8\u672C\u7AD9\u6536\u5F55\u7684\u684C\u5BA0\uFF0C\u6253\u5F00\u5408\u96C6\u540E\u53EF\u9010\u4E2A\u9884\u89C8\u548C\u4E0B\u8F7D\u3002</p></div>
      <div class="community-toolbar community-collection-toolbar">
        <label class="search community-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg><input id="collection-search" type="search" placeholder="\u641C\u7D22\u5408\u96C6\u6216\u4E3B\u9898\u2026" aria-label="\u641C\u7D22\u5408\u96C6"></label>
        <div id="collection-filter" class="community-filter" role="group" aria-label="\u5408\u96C6\u7C7B\u578B"><button type="button" data-collection-filter="all" aria-pressed="true">\u5168\u90E8</button><button type="button" data-collection-filter="franchise" aria-pressed="false">\u4F5C\u54C1\u7CFB\u5217</button><button type="button" data-collection-filter="theme" aria-pressed="false">\u4E3B\u9898\u7CFB\u5217</button></div>
      </div>
      <div id="collection-list" class="community-collection-grid"></div>
      <div id="collection-detail" class="community-collection-detail" hidden>
        <a class="community-back" href="#collections">\u2190 \u8FD4\u56DE\u5408\u96C6</a>
        <h2 id="collection-detail-title"></h2>
        <p id="collection-detail-description" class="community-scope"></p>
        <div id="collection-pets" class="gallery-grid"></div>
      </div>
    </section>
    <section id="requests-view" class="community-page" hidden>
      <div class="community-page-heading"><h1>\u684C\u5BA0\u9700\u6C42\u5E7F\u573A</h1></div>
      <div class="community-toolbar">
        <label class="search community-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="m15.5 15.5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg><input id="request-search" type="search" placeholder="\u641C\u7D22\u89D2\u8272\u6216\u5236\u4F5C\u9700\u6C42\u2026" aria-label="\u641C\u7D22\u5236\u4F5C\u9700\u6C42"></label>
        <label class="community-inline-label">\u7B5B\u9009<select id="request-state"><option value="all">\u5168\u90E8\u9700\u6C42</option><option value="waiting">\u5F85\u5236\u4F5C</option><option value="following">\u6211\u5173\u6CE8\u7684</option></select></label>
        <button id="export-requests" class="secondary" type="button">\u5BFC\u51FA\u6211\u7684\u9700\u6C42</button>
      </div>
      <div id="request-list" class="community-request-grid"></div>
      <form id="request-form" class="community-request-form">
        <div class="community-form-heading"><h2>\u7533\u8BF7\u4F60\u559C\u6B22\u7684\u89D2\u8272</h2></div>
        <div class="field-grid"><label>\u89D2\u8272\u6216\u4F5C\u54C1\u540D\u79F0<input name="title" required maxlength="80" placeholder="\u4F8B\u5982\uFF1A\u6234\u8033\u673A\u7684\u4E91\u6735\u5C0F\u732B"></label><label>\u5206\u7C7B<select name="category"><option>\u539F\u521B\u89D2\u8272</option><option>\u6E38\u620F\u89D2\u8272</option><option>\u52A8\u6F2B\u89D2\u8272</option><option>\u5409\u7965\u7269</option><option>\u5176\u4ED6</option><option>\u673A\u5668\u4EBA</option><option>\u4EBA\u7269\u5934\u50CF</option><option>\u52A8\u7269\u4F19\u4F34</option><option>\u5E7B\u60F3\u751F\u7269</option><option>\u7F51\u7EDC\u6897\u56FE</option><option>\u7269\u4EF6\u4E0E\u9053\u5177</option></select></label></div>
        <label>\u5236\u4F5C\u8BF4\u660E<textarea name="description" required maxlength="1000" rows="4" placeholder="\u5B83\u7684\u6A21\u6837\u3001\u4E2A\u6027\u6216\u4F60\u60F3\u770B\u5230\u7684\u52A8\u4F5C\u2026"></textarea></label>
        <div class="community-form-actions"><label>\u56FE\u96C6\u7248\u672C<select name="version"><option value="2">V2 \xB7 \u52A8\u4F5C\u4E0E 16 \u5411\u6CE8\u89C6</option><option value="1">V1 \xB7 \u4E5D\u7EC4\u52A8\u4F5C</option></select></label><button id="request-publish" class="primary" type="submit" disabled>\u53D1\u5E03\u5236\u4F5C\u9700\u6C42</button><button class="secondary" type="submit">\u4FDD\u5B58\u8349\u7A3F</button><a id="request-public-site" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u524D\u5F80\u516C\u5F00\u5171\u521B\u5E73\u53F0</a></div>
        <p id="request-feedback" class="community-feedback" role="status" aria-live="polite"></p><a id="request-submission-link" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u6253\u5F00\u672C\u7AD9\u9700\u6C42\u6295\u7A3F</a>
      </form>
      <div id="request-export" class="form-panel" hidden>
        <h2>\u6211\u7684\u5236\u4F5C\u9700\u6C42\u8BF4\u660E</h2>
        <p class="community-scope">\u53EF\u4FDD\u5B58 Markdown\uFF0C\u4E5F\u53EF\u4EE5\u590D\u5236\u540E\u4EA4\u7ED9\u4F60\u9009\u62E9\u7684 AI\u3002</p>
        <label>\u5236\u4F5C\u9700\u6C42 Markdown<textarea id="request-export-text" readonly rows="10"></textarea></label>
        <button id="copy-request-export" class="secondary" type="button">\u590D\u5236\u5236\u4F5C\u9700\u6C42</button>
      </div>
    </section>
    <section id="create-view" hidden>
      <div class="gallery-heading"><div><p class="eyebrow">\u521B\u4F5C\u8005\u5DE5\u4F5C\u53F0</p><h1>\u5171\u521B\u5E73\u53F0</h1></div><a class="button secondary" href="#pets">\u8FD4\u56DE\u5E7F\u573A</a></div>
      <nav class="creation-tabs" aria-label="\u5171\u521B\u5165\u53E3"><a class="button secondary" href="#create/pet-make" data-creator-route="pet-make">\u5236\u4F5C\u684C\u5BA0</a><a class="button secondary" href="#create/plugin-make" data-creator-route="plugin-make">\u5236\u4F5C\u63D2\u4EF6</a><a class="button secondary" href="#create/pet-import" data-creator-route="pet-import">\u5BFC\u5165\u684C\u5BA0</a><a class="button secondary" href="#create/plugin-import" data-creator-route="plugin-import">\u5BFC\u5165\u63D2\u4EF6</a></nav>
      <div id="creator-start" class="form-panel"><h2>\u9009\u62E9\u4E00\u79CD\u5171\u521B\u65B9\u5F0F</h2></div>
      <h2 id="creator-workflow-title" hidden></h2>
      <div class="form-panel plugin-publication-panel"><p id="plugin-publication-status" class="hint" role="status">\u6B63\u5728\u68C0\u67E5\u6295\u7A3F\u670D\u52A1\u2026</p><a id="plugin-public-site" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u524D\u5F80\u516C\u5F00\u5171\u521B\u5E73\u53F0</a><a id="creator-submission-link" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>\u6253\u5F00\u672C\u7AD9\u6295\u7A3F\u8868\u5355</a><p id="plugin-publication-help" class="hint"></p></div>
      <div id="pet-form-panel" aria-label="\u684C\u5BA0\u4F5C\u54C1\u5DE5\u4F5C\u53F0" hidden>
        <form id="pet-form" class="creator-layout">
          <div class="form-panel">
            <h2>\u4F5C\u54C1\u4FE1\u606F</h2>
            <div class="field-grid"><label>\u540D\u79F0<input name="displayName" required maxlength="80" placeholder="\u4F8B\u5982\uFF1A\u4E91\u6735\u5C0F\u732B"></label><label>\u4F5C\u54C1 ID<input name="id" required maxlength="64" pattern="[a-z0-9][a-z0-9_-]{0,63}" placeholder="\u4F8B\u5982\uFF1Acloud-cat"></label></div>
            <label>\u7B80\u4ECB<textarea name="description" required maxlength="500" rows="3" placeholder="\u5B83\u662F\u4EC0\u4E48\u6837\u7684\u4F19\u4F34\uFF1F"></textarea></label>
            <div class="field-grid"><label>\u4F5C\u8005<input name="author" required maxlength="120" placeholder="\u4F60\u7684\u7F72\u540D"></label><label>\u8BB8\u53EF\u58F0\u660E<input name="license" required maxlength="200" placeholder="\u4F8B\u5982\uFF1ACC BY-NC 4.0 \u6216\u4E2A\u4EBA\u4F7F\u7528"></label></div>
            <input name="source" type="hidden" value="">
            <div id="pet-make-fields">
              <label>\u52A8\u4F5C\u7D20\u6750\u65B9\u5F0F<select id="pet-media-mode"><option value="video">\u9010\u52A8\u4F5C\u89C6\u9891 / \u52A8\u753B WebP</option><option value="atlas">WebP \u56FE\u96C6</option></select></label>
              <div id="pet-video-fields"><label class="upload-label">\u6DFB\u52A0\u52A8\u4F5C\u6587\u4EF6<input id="clip-input" type="file" accept="video/mp4,video/webm,image/webp,.mp4,.webm,.webp" multiple></label><p class="hint">\u6BCF\u4E2A\u6587\u4EF6\u662F\u4E00\u4E2A\u72EC\u7ACB\u52A8\u4F5C\u3002\u540D\u79F0\u3001\u79CD\u7C7B\u548C\u4E0E AI \u72B6\u6001\u7684\u5BF9\u5E94\u5173\u7CFB\u5747\u53EF\u81EA\u5B9A\u4E49\uFF0C\u672A\u7ED1\u5B9A\u72B6\u6001\u663E\u793A\u5F85\u673A\u3002\u5355\u6587\u4EF6 100 MB\uFF0C\u603B\u8BA1 200 MB\u3002</p><div id="clip-list" class="creator-clips"></div><div class="field-grid"><label>\u80CC\u666F\u5904\u7406<select id="clip-background"><option value="chroma">\u7EAF\u8272\u80CC\u666F\u53BB\u80CC</option><option value="alpha">\u7D20\u6750\u81EA\u5E26\u900F\u660E\u901A\u9053</option></select></label><label id="clip-color-label">\u80CC\u666F\u989C\u8272<input id="clip-color" type="color" value="#00ff00"></label></div><details><summary>AI \u4E0E\u4EA4\u4E92\u52A8\u4F5C\u7ED1\u5B9A</summary><div id="state-bindings" class="field-grid"></div></details></div>
              <div id="pet-atlas-fields" hidden><label class="upload-label">\u9009\u62E9 WebP \u56FE\u96C6<input id="atlas-input" type="file" accept="image/webp,.webp"></label><p class="hint">V1\uFF1A1536 \xD7 1872\uFF1BV2\uFF1A1536 \xD7 2288\u3002\u6BCF\u683C 192 \xD7 208\uFF0C8 \u5217\uFF0C\u900F\u660E\u80CC\u666F\u3002\u6700\u5927 24 MB\u3002</p></div>
            </div>
            <div id="pet-import-fields" hidden><h3>\u5148\u5BFC\u5165\u539F\u9879\u76EE\u6587\u4EF6</h3><div class="package-upload-options"><label class="upload-label">ZIP<input id="pet-package-zip" type="file" accept=".zip,application/zip"></label><label class="upload-label">\u5B8C\u6574\u6587\u4EF6\u5939<input id="pet-package-folder" type="file" webkitdirectory multiple></label><label class="upload-label">\u6E05\u5355\u4E0E\u914D\u5957\u6587\u4EF6<input id="pet-package-files" type="file" multiple></label></div><div id="pet-compatibility" class="compatibility-report" hidden></div><p id="pet-package-status" class="hint" role="status">\u5C1A\u672A\u5BFC\u5165\u6587\u4EF6</p><div id="pet-import-capabilities" class="import-capabilities"><button class="secondary" type="button" data-import-preview disabled>\u9884\u89C8\u539F\u7D20\u6750</button><button class="secondary" type="button" disabled title="\u5BFC\u5165\u4FDD\u7559\u539F\u6E05\u5355\uFF0C\u4E0D\u5728\u7F51\u9875\u6539\u5199\u6620\u5C04">AI \u52A8\u4F5C\u7ED1\u5B9A\u7531\u539F\u6E05\u5355\u5B9A\u4E49</button><p id="pet-import-capability-note" class="hint">\u5BFC\u5165\u540E\u663E\u793A\u672C\u7CFB\u7EDF\u652F\u6301\u8303\u56F4\u3002</p></div><div id="pet-import-preview" class="preview-stage" hidden></div><ul id="pet-package-list" class="package-file-list"></ul></div>
            <div class="creator-submit-actions"><button id="pet-publish" class="primary" type="submit" disabled>\u6253\u5305\u5E76\u53D1\u5E03</button><button id="pet-download-backup" class="secondary" type="button">\u4E0B\u8F7D\u5206\u4EAB ZIP</button><button class="secondary" type="button" data-save-draft="pet">\u4FDD\u5B58\u8349\u7A3F</button><button class="secondary" type="button" data-restore-draft="pet">\u6062\u590D\u8349\u7A3F</button></div>
          </div>
          <aside class="preview-panel">
            <span class="eyebrow">\u52A8\u4F5C\u9884\u89C8</span>
            <div id="creator-pet-stage" class="preview-stage"><p>\u9009\u62E9\u56FE\u96C6\u540E\uFF0C\u5728\u8FD9\u91CC\u9884\u89C8</p></div>
            <label>\u9884\u89C8\u80CC\u666F<select id="creator-background"><option value="checker">\u900F\u660E\u68CB\u76D8</option><option value="light">\u6D45\u8272\u80CC\u666F</option><option value="dark">\u6DF1\u8272\u80CC\u666F</option></select></label>
            <label>\u9884\u89C8\u52A8\u4F5C<select id="creator-action" disabled></select></label>
            <div id="creator-action-buttons" class="action-grid" role="group" aria-label="\u4E0A\u4F20\u56FE\u96C6\u7684\u4E5D\u7EC4\u52A8\u4F5C"></div>
            <div id="creator-look-section" hidden>
              <h3 class="preview-subheading">16 \u5411\u6CE8\u89C6</h3>
              <div id="creator-look-buttons" class="look-grid" role="group" aria-label="\u4E0A\u4F20\u56FE\u96C6\u7684\u5341\u516D\u65B9\u5411\u6CE8\u89C6"></div>
            </div>
            <p id="creator-current-preview" class="hint" role="status">\u9009\u62E9\u56FE\u96C6\u540E\u5373\u53EF\u9884\u89C8</p>
            
            <p id="atlas-status" class="hint" role="status">\u7B49\u5F85\u9009\u62E9\u56FE\u96C6</p>
            
          </aside>
        </form>
      </div>
      <div id="plugin-form-panel" aria-label="\u63D2\u4EF6\u4F5C\u54C1\u5DE5\u4F5C\u53F0" hidden>
        <form id="plugin-form" class="creator-layout">
          <div class="form-panel"><h2 id="plugin-upload-title">\u4E0A\u4F20\u4F60\u5236\u4F5C\u7684\u63D2\u4EF6</h2><div id="plugin-file-fields"><div class="package-upload-options"><label class="upload-label">ZIP<input id="plugin-package-zip" type="file" accept=".zip,application/zip"></label><label class="upload-label">\u5B8C\u6574\u6587\u4EF6\u5939<input id="plugin-package-folder" type="file" webkitdirectory multiple></label><label class="upload-label">\u6E05\u5355\u4E0E\u914D\u5957\u6587\u4EF6<input id="plugin-package-files" type="file" multiple></label></div><div id="plugin-compatibility" class="compatibility-report" hidden></div></div><h3>\u4F5C\u54C1\u4FE1\u606F</h3><div class="field-grid"><label>\u63D2\u4EF6\u540D\u79F0<input name="title" required maxlength="120" placeholder="\u6211\u7684\u63D2\u4EF6"></label><label>\u4F5C\u54C1 ID<input name="id" required maxlength="64" placeholder="author.my-plugin"></label></div><label>\u8BF4\u660E<textarea name="description" required maxlength="1000" rows="3" placeholder="\u529F\u80FD\u3001\u9002\u7528\u73AF\u5883\u4E0E\u5B89\u88C5\u6761\u4EF6"></textarea></label><div class="field-grid"><label>\u4F5C\u8005<input name="author" required maxlength="120" placeholder="\u4F60\u7684\u7F72\u540D"></label><label>\u8BB8\u53EF\u58F0\u660E<input name="license" required maxlength="200" placeholder="\u4F8B\u5982\uFF1AMIT"></label></div><input name="source" type="hidden" value=""><label class="upload-label">\u63D2\u4EF6\u5E7F\u573A\u5361\u7247\u5C01\u9762\uFF08\u53EF\u9009\uFF09<input id="plugin-cover-input" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"></label><button id="plugin-cover-remove" class="secondary" type="button" hidden>\u79FB\u9664\u672C\u6B21\u5C01\u9762</button><div class="creator-submit-actions"><button id="plugin-publish" class="primary" type="submit" disabled>\u6253\u5305\u5E76\u53D1\u5E03</button><button id="plugin-download-backup" class="secondary" type="button">\u4E0B\u8F7D\u5206\u4EAB ZIP</button><button class="secondary" type="button" data-save-draft="plugin">\u4FDD\u5B58\u8349\u7A3F</button><button class="secondary" type="button" data-restore-draft="plugin">\u6062\u590D\u8349\u7A3F</button></div></div>
          <aside class="preview-panel"><span class="eyebrow">\u63D2\u4EF6\u5E7F\u573A\u5361\u7247\u9884\u89C8</span><div id="plugin-card-preview"></div><h3>\u4F5C\u54C1\u6587\u4EF6</h3><p id="plugin-package-status" class="hint" role="status">\u5C1A\u672A\u5BFC\u5165\u6587\u4EF6</p><ul id="plugin-package-list" class="package-file-list"></ul><h3>\u58F0\u660E\u6743\u9650</h3><p id="permission-preview">\u5C1A\u672A\u8BFB\u53D6\u6E05\u5355</p><div class="import-capabilities"><button class="secondary" type="button" disabled>\u8FD0\u884C\u63D2\u4EF6</button><button class="secondary" type="button" disabled>\u8FD0\u884C\u914D\u7F6E</button><p id="plugin-import-capability-note" class="hint"></p></div></aside>
        </form>
      </div>
      <p id="creator-publishing-note" class="hint creator-publishing-note">\u63D0\u4EA4\u6295\u7A3F\u540E\uFF0C\u5BA1\u6838\u6536\u5F55\u624D\u4F1A\u5728\u5E7F\u573A\u663E\u793A\u3002</p>
      <p id="creator-feedback" class="feedback" role="status" aria-live="polite"></p>
    </section>
    <section id="guide-view" hidden>
      <div class="gallery-heading"><div><p class="eyebrow">\u4ECE\u7F51\u7AD9\u5230\u684C\u9762</p><h1>\u4E0B\u8F7D\uFF0C\u5BFC\u5165\uFF0C\u5F00\u59CB\u966A\u4F34</h1></div></div>
      <div class="guide-grid"><article class="form-panel"><span class="step">01</span><h2>\u5B89\u88C5\u684C\u5BA0</h2><p>\u5728\u5E7F\u573A\u9884\u89C8\u52A8\u4F5C\uFF0C\u4E0B\u8F7D\u684C\u5BA0 ZIP\u3002\u6253\u5F00\u63A7\u5236\u4E2D\u5FC3\u300C\u6211\u7684\u684C\u5BA0\u300D\uFF0C\u9009\u62E9\u300C\u5BFC\u5165 ZIP \u6216\u6587\u4EF6\u5939\u300D\u5E76\u5BFC\u5165 ZIP\uFF0C\u7136\u540E\u8BBE\u4E3A\u684C\u9762\u4F19\u4F34\u3002</p><p>\u5DF2\u5B58\u5728\u7684\u7F16\u53F7\u4F1A\u6309\u672C\u5730\u5BFC\u5165\u89C4\u5219\u5904\u7406\uFF0C\u5185\u7F6E\u684C\u5BA0\u65E0\u9700\u518D\u6B21\u5B89\u88C5\u3002</p></article><article class="form-panel"><span class="step">02</span><h2>\u5B89\u88C5\u63D2\u4EF6</h2><p>\u4E0B\u8F7D\u63D2\u4EF6 ZIP \u5E76\u89E3\u538B\u3002\u5728\u300C\u63D2\u4EF6\u7BA1\u7406\u300D\u9009\u62E9\u300C\u5BFC\u5165\u63D2\u4EF6\u6587\u4EF6\u5939\u300D\uFF0C\u9009\u4E2D\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u3002\u9605\u8BFB\u5E76\u786E\u8BA4\u6743\u9650\u540E\u518D\u542F\u7528\u3002</p><p>\u63D0\u9192\u662F\u5426\u5F00\u542F\u3001\u8FD0\u884C\u9891\u7387\u4E0E\u505C\u7528\u64CD\u4F5C\u7531\u672C\u673A\u63A7\u5236\u3002</p></article><article class="form-panel"><span class="step">03</span><h2>\u8FDE\u63A5\u4F60\u9009\u62E9\u7684 AI</h2><p>\u5728\u63A7\u5236\u4E2D\u5FC3\u300C\u5BA0\u7269\u5927\u8111\u300D\u914D\u7F6E\u591A\u4E2A\u63D0\u4F9B\u65B9\u6216\u517C\u5BB9\u63A5\u53E3\uFF1B\u5728\u300C\u5916\u90E8 AI \u63A5\u5165\u300D\u8FDE\u63A5\u652F\u6301\u7684\u672C\u673A\u5DE5\u5177\u3002\u5916\u89C2\u7D20\u6750\u4E0D\u7ED1\u5B9A\u5355\u4E00 AI\u3002</p><p>\u5BC6\u94A5\u3001\u4EBA\u8BBE\u3001\u804A\u5929\u4E0E\u7535\u8111\u6587\u4EF6\u90FD\u7559\u5728\u672C\u5730\u914D\u7F6E\u6D41\u7A0B\u4E2D\u3002</p></article></div>
    </section>
  </main>
  <footer><span>desktop pet</span><p>\u4F5C\u54C1\u5728\u7F51\u7AD9\u76F8\u9047\uFF0C\u966A\u4F34\u5728\u4F60\u7684\u684C\u9762\u53D1\u751F\u3002</p><a href="#guide">\u5B89\u88C5\u6307\u5357</a></footer>
  <dialog id="pet-detail" aria-labelledby="detail-title">
    <div class="dialog-heading"><h2 id="detail-title">\u684C\u5BA0\u52A8\u4F5C\u9884\u89C8</h2><button id="close-detail" class="secondary" aria-label="\u5173\u95ED\u8BE6\u60C5">\u5173\u95ED</button></div>
    <div class="detail-layout">
      <div class="detail-visual">
        <div id="detail-pet-stage" class="preview-stage"><div id="detail-sprite" class="sprite large" role="img" aria-label="\u684C\u5BA0\u52A8\u4F5C"></div></div>
        <label>\u9884\u89C8\u80CC\u666F<select id="detail-background"><option value="checker">\u900F\u660E\u68CB\u76D8</option><option value="light">\u6D45\u8272\u80CC\u666F</option><option value="dark">\u6DF1\u8272\u80CC\u666F</option></select></label>
        <p id="detail-current-preview" class="hint" role="status">\u6B63\u5728\u9884\u89C8\uFF1A\u5B89\u9759\u966A\u4F34</p>
      </div>
      <div class="detail-information">
        <p id="detail-author" class="byline"></p>
        <p id="detail-description"></p>
        <label>\u52A8\u4F5C<select id="detail-action"></select></label>
        <div id="detail-action-buttons" class="action-grid" role="group" aria-label="\u4E5D\u7EC4\u52A8\u4F5C"></div>
        <div id="detail-look-section">
          <h3 class="preview-subheading">16 \u5411\u6CE8\u89C6</h3>
          <p class="hint">\u4EE5\u5C4F\u5E55\u4E3A\u65B9\u5411\uFF1A0\xB0 \u5411\u4E0A\uFF0C90\xB0 \u5411\u53F3\u3002\u70B9\u51FB\u67E5\u770B\u5B9E\u9645\u5355\u5E27\u59FF\u6001\u3002</p>
          <div id="detail-look-buttons" class="look-grid" role="group" aria-label="\u5341\u516D\u65B9\u5411\u6CE8\u89C6"></div>
        </div>
        <div class="dialog-actions"><a id="detail-download" class="button primary" download>\u4E0B\u8F7D\u684C\u5BA0 ZIP</a></div>
      </div>
    </div>
  </dialog>
  <p id="toast" class="toast" role="status" hidden></p>
</body>
</html>
`,type:"text/html; charset=utf-8"}},Fe={},$e={},Yt=[{id:"community.water-break",title:"\u559D\u6C34\u5C0F\u63D0\u9192",description:"\u5FD9\u788C\u7684\u65F6\u5019\uFF0C\u4E5F\u8BB0\u5F97\u559D\u53E3\u6C34\u3002\u95F4\u9694\u548C\u53F0\u8BCD\u90FD\u53EF\u91CD\u65B0\u521B\u4F5C\u3002",everyMinutes:45,speech:"\u559D\u53E3\u6C34\uFF0C\u4F11\u606F\u4E00\u4E0B\u5427\u3002",reaction:"waving",category:"\u5065\u5EB7\u63D0\u9192",symbol:"\u6C34"},{id:"community.eye-break",title:"\u8FDC\u773A\u4E00\u5206\u949F",description:"\u628A\u89C6\u7EBF\u4ECE\u5C4F\u5E55\u79FB\u5F00\uFF0C\u8BA9\u773C\u775B\u548C\u684C\u5BA0\u4E00\u8D77\u4F11\u606F\u3002",everyMinutes:20,speech:"\u770B\u770B\u8FDC\u5904\uFF0C\u8BA9\u773C\u775B\u4F11\u606F\u4E00\u4E0B\u3002",reaction:"idle",category:"\u5065\u5EB7\u63D0\u9192",symbol:"\u76EE"},{id:"community.focus-break",title:"\u4E13\u6CE8\u540E\u4F11\u606F",description:"\u6BCF\u9694\u4E00\u6BB5\u65F6\u95F4\u6E29\u548C\u63D0\u9192\u4F11\u606F\u3002\u5468\u671F\u91CD\u590D\u8FD0\u884C\uFF0C\u53EF\u5728\u672C\u5730\u505C\u7528\u3002",everyMinutes:25,speech:"\u4E00\u6BB5\u4E13\u6CE8\u7ED3\u675F\u5566\uFF0C\u7AD9\u8D77\u6765\u6D3B\u52A8\u4E00\u4E0B\u3002",reaction:"celebrating",category:"\u4E13\u6CE8\u966A\u4F34",symbol:"\u6B47"}],Ee="Lykinzlj",Wt=[{id:"firefly--lingxiaotian",title:"\u6D41\u8424",englishTitle:"Firefly",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u6D41\u8424\u53D8\u8EAB\u524D\u7684\u4EBA\u7C7B\u5F62\u6001 Codex \u6570\u7801\u5BA0\u7269\uFF0C\u6E29\u67D4\u3001\u8F7B\u76C8\u3001\u767D\u7EFF\u91D1\u914D\u8272\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/firefly--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/firefly--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","firefly","white-hair","mint-green"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/firefly--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/firefly--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/firefly--lingxiaotian",spritesheetSha256:"bd0a0deea6bfac69cfd6ebbec02e254536a6276a3958e5794a1b256aed074583",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"acheron--lingxiaotian",title:"\u9EC4\u6CC9",englishTitle:"Acheron",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9EC4\u6CC9\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u9ED1\u957F\u53D1\u3001\u7EA2\u8272\u53D1\u9970\u3001\u767D\u9ED1\u670D\u88C5\u548C\u51B7\u9759\u950B\u5229\u7684\u5200\u7CFB\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/acheron--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/acheron--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","acheron","sword","purple"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/acheron--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/acheron--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/acheron--lingxiaotian",spritesheetSha256:"fc34319c614cebcfbd7efabb10b9bcebaef039bc487c243402b791f607c9cfda",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"aemeath-mini--cunuo",title:"Aemeath Mini",englishTitle:"Aemeath Mini",description:"A Q-style pixel Aemeath companion with soft expressions and small animated desktop-pet motions.",category:"\u5409\u7965\u7269",author:"cuNuo",authorHandle:"cuNuo",kind:"pet",atlas:"assets/pets/upstream-20261009/aemeath-mini--cunuo.webp",thumbnail:"assets/pets/upstream-20261009/aemeath-mini--cunuo-thumb.webp",version:1,tags:["aemeath","pixel-art","q-style","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/aemeath-mini--cunuo",license:"MIT License",download:"assets/pets/upstream-20261009/aemeath-mini--cunuo.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/aemeath-mini--cunuo",spritesheetSha256:"f6b2677b8e16bf1b73b0425e60bb6439bac803e108e073ef9b9dc128a762a1dc",metadataNameAlias:!1,authorUrl:"https://github.com/cuNuo"},{id:"apu--xchangee",title:"Apu",englishTitle:"Apu",description:"A round blue-and-yellow helper pet with a little hat, soft expressions, and cheerful Codex work animations.",category:"\u5409\u7965\u7269",author:"tal",authorHandle:"xchangee",kind:"pet",atlas:"assets/pets/upstream-20261009/apu--xchangee.webp",thumbnail:"assets/pets/upstream-20261009/apu--xchangee-thumb.webp",version:1,tags:["apu","helper","round","cute","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/apu--xchangee",license:"MIT License",download:"assets/pets/upstream-20261009/apu--xchangee.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/apu--xchangee",spritesheetSha256:"315868428da4962bc38bc9ce0c5e6c1ff7e52bd548b3e5ef1a527469b73f1ab6",metadataNameAlias:!1,authorUrl:"https://github.com/xchangee"},{id:"arlecchino--lingxiaotian",title:"\u963F\u857E\u5947\u8BFA",englishTitle:"Arlecchino",description:"\u300A\u539F\u795E\u300B\u963F\u857E\u5947\u8BFA\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9ED1\u767D\u7EA2\u914D\u8272\u3001\u77ED\u62AB\u98CE\u4E0E\u51B7\u5CFB\u950B\u5229\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/arlecchino--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/arlecchino--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","arlecchino","black-white-red","stern"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arlecchino--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/arlecchino--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/arlecchino--lingxiaotian",spritesheetSha256:"aa311d2686e3a8fc7edbbbcaff2e824f821582a27694d7385c2c1416de6622e4",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"becky--natewanggg",title:"Becky",englishTitle:"Becky",description:"A slim dark-gray mackerel tabby Codex pet based on Becky, with curled ears, very round pale yellow eyes, black paw pads, and a thin ring-striped tail.",category:"\u52A8\u7269\u4F19\u4F34",author:"NateWanggg",authorHandle:"NateWanggg",kind:"pet",atlas:"assets/pets/upstream-20261009/becky--natewanggg.webp",thumbnail:"assets/pets/upstream-20261009/becky--natewanggg-thumb.webp",version:1,tags:["cat","tabby","becky","original-pet","dark-gray"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/becky--natewanggg",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/becky--natewanggg.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/becky--natewanggg",spritesheetSha256:"8e76db46a3712cabf22e426202307d8467f925d3f40d9116070345095add04f6",metadataNameAlias:!1,authorUrl:"https://github.com/NateWanggg"},{id:"black-swan--lingxiaotian",title:"\u9ED1\u5929\u9E45",englishTitle:"Black Swan",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9ED1\u5929\u9E45\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7EB1\u5E3D\u3001\u7D2B\u9ED1\u793C\u670D\u4E0E\u795E\u79D8\u5360\u535C\u5E08\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/black-swan--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/black-swan--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","black-swan","mystic","veil"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/black-swan--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/black-swan--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/black-swan--lingxiaotian",spritesheetSha256:"531944d7a896777932ee15ea2480874e15a9112dc6319b4243e380de31c53ab5",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"bubu--gbn666",title:"Bubu",englishTitle:"Bubu",description:"A soft, sleepy milk-tea-brown chibi bear desktop pet with warm cheek patches and relaxed pixel-art motions.",category:"\u52A8\u7269\u4F19\u4F34",author:"Guo Beining",authorHandle:"gbn666",kind:"pet",atlas:"assets/pets/upstream-20261009/bubu--gbn666.webp",thumbnail:"assets/pets/upstream-20261009/bubu--gbn666-thumb.webp",version:1,tags:["bear","chibi","pixel-art","sleepy","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu--gbn666",license:"MIT License",download:"assets/pets/upstream-20261009/bubu--gbn666.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/bubu--gbn666",spritesheetSha256:"6eecf5d23b066a24172017232144f717e674c6a493d12de126399837ef22db6f",metadataNameAlias:!1,authorUrl:"https://github.com/gbn666"},{id:"buttercup--legeling",title:"\u6BDB\u6BDB",englishTitle:"Buttercup",description:"A classic green Powerpuff Girl with black flipped hair and a confident expression.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/buttercup--legeling.webp",thumbnail:"assets/pets/upstream-20261009/buttercup--legeling-thumb.webp",version:2,tags:["community-request","powerpuff-girls","buttercup"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/buttercup--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/buttercup--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/buttercup--legeling",spritesheetSha256:"8eadf67be926a4c3fca15daac6844022c9582421bc690e93e32523386f5d8635",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"castorice--lingxiaotian",title:"\u9050\u8776",englishTitle:"Castorice",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9050\u8776\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u9ED1\u914D\u8272\u3001\u8776\u5F62\u610F\u8C61\u3001\u957F\u53D1\u8F6E\u5ED3\u548C\u67D4\u548C\u795E\u79D8\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/castorice--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/castorice--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","castorice","butterfly","purple"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/castorice--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/castorice--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/castorice--lingxiaotian",spritesheetSha256:"99c0b3504aad7f38dd239cae49412ed39a4c23ae3c24fd052e83a74bb6866372",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"chud-codex--jorge-cuevas90003",title:"Chud Codex",englishTitle:"Chud Codex",description:"An original grimdark chibi sci-fi cadet in black-and-brass armor with a glowing red visor and an absurdly serious attitude.",category:"\u539F\u521B\u89D2\u8272",author:"Jorge",authorHandle:"Jorge-Cuevas90003",kind:"pet",atlas:"assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.webp",thumbnail:"assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003-thumb.webp",version:2,tags:["grimdark","sci-fi","cadet","armored","chibi","original","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/chud-codex--jorge-cuevas90003",license:"CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge; no third-party source assets were used.",download:"assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/chud-codex--jorge-cuevas90003",spritesheetSha256:"e1211e3317065e70ef342f97fcc37337036c1e41ab2818db5c8c378c976dfc79",metadataNameAlias:!1,authorUrl:"https://github.com/Jorge-Cuevas90003"},{id:"citlali--zaytsevzy",title:"\u831C\u7279\u83C8\u8389",englishTitle:"Citlali",description:"\u5750\u5728\u4F0A\u5179\u5E15\u5E15\u4E0A\u7684\u50CF\u7D20\u831C\u7279\u83C8\u8389\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"ZaytsevZY",authorHandle:"ZaytsevZY",kind:"pet",atlas:"assets/pets/upstream-20261009/citlali--zaytsevzy.webp",thumbnail:"assets/pets/upstream-20261009/citlali--zaytsevzy-thumb.webp",version:2,tags:["anime","genshin-impact","citlali","pixel-art","reading"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/citlali--zaytsevzy",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/citlali--zaytsevzy.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/citlali--zaytsevzy",spritesheetSha256:"9fbe935730ba52af3e80a41e6a698391b73d2a872c9fcf2a7ce9c44e9ec98ed3",metadataNameAlias:!1,authorUrl:"https://github.com/ZaytsevZY"},{id:"claude--xiangking",title:"Claude",englishTitle:"Claude",description:"A tiny orange blocky digital pet with stubby side arms, short legs, and expressive pixel-art poses.",category:"\u5409\u7965\u7269",author:"XiangWang",authorHandle:"xiangking",kind:"pet",atlas:"assets/pets/upstream-20261009/claude--xiangking.webp",thumbnail:"assets/pets/upstream-20261009/claude--xiangking-thumb.webp",version:1,tags:["orange","pixel-art","blocky","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/claude--xiangking",license:"MIT License",download:"assets/pets/upstream-20261009/claude--xiangking.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/claude--xiangking",spritesheetSha256:"ddab2df6b9f7c52267f6baad85d4c3a5ccceccae6ac1b0f325e97bb5348e0e75",metadataNameAlias:!1,authorUrl:"https://github.com/xiangking"},{id:"codexy--z19t",title:"\u7801\u7075",englishTitle:"Codexy",description:"An original mint-haired Codex AI assistant with hardworking task animations and a complete 16-direction look loop.",category:"\u539F\u521B\u89D2\u8272",author:"z19t",authorHandle:"z19t",kind:"pet",atlas:"assets/pets/upstream-20261009/codexy--z19t.webp",thumbnail:"assets/pets/upstream-20261009/codexy--z19t-thumb.webp",version:2,tags:["ai-assistant","anime","coding","codex","mint-hair","original","terminal-companion","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/codexy--z19t",license:"CC BY-NC 4.0. Original AI-generated artwork independently created and adapted by z19t; non-commercial use only.",download:"assets/pets/upstream-20261009/codexy--z19t.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/codexy--z19t",spritesheetSha256:"e65f68c7e7f9c8dc858e8d601f39bbe4942e3dbb889d61a06868c69289f8d1e4",metadataNameAlias:!1,authorUrl:"https://github.com/z19t"},{id:"corgi-companion--cxian0928-afk",title:"Corgi Companion",englishTitle:"Corgi Companion",description:"A cheerful corgi companion with bright ears, a friendly grin, and playful laptop-working poses.",category:"\u52A8\u7269\u4F19\u4F34",author:"cxian0928-afk",authorHandle:"cxian0928-afk",kind:"pet",atlas:"assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.webp",thumbnail:"assets/pets/upstream-20261009/corgi-companion--cxian0928-afk-thumb.webp",version:1,tags:["corgi","dog","orange","cute","laptop","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/corgi-companion--cxian0928-afk",license:"MIT License",download:"assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/corgi-companion--cxian0928-afk",spritesheetSha256:"7ce091d553f8c52608c80f0d61a602cd50f13459d912e1c9a9862694a77fec40",metadataNameAlias:!1,authorUrl:"https://github.com/cxian0928-afk"},{id:"crt-monitor--wxy",title:"CRT \u663E\u793A\u5668",englishTitle:"CRT Monitor",description:"A tiny retro CRT monitor that keeps an eye on your code.",category:"\u673A\u5668\u4EBA",author:"wxy",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/crt-monitor--wxy.webp",thumbnail:"assets/pets/upstream-20261009/crt-monitor--wxy-thumb.webp",version:2,tags:["robot","retro-computing","crt","coding"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/crt-monitor--wxy",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/crt-monitor--wxy.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/crt-monitor--wxy",spritesheetSha256:"4027e21fb235f5bc5eb992e711531dfb2ac3641eeb1056e21e338c1b28806970",metadataNameAlias:!1},{id:"cyrene--lingxiaotian",title:"\u6614\u6D9F",englishTitle:"Cyrene",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u6614\u6D9F\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7C89\u767D\u957F\u53D1\u3001\u767D\u7C89\u84DD\u793C\u88D9\u3001\u7FBD\u53F6\u72B6\u5934\u9970\u4E0E\u8F7B\u76C8\u68A6\u5E7B\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/cyrene--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/cyrene--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","cyrene","pink","dreamy"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/cyrene--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/cyrene--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/cyrene--lingxiaotian",spritesheetSha256:"451b409ab66cc60ab1e7f06136a0cb8c76dbb147816c779d57675912becb36b0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"desk-otter--zihualiu1997",title:"Desk Otter",englishTitle:"Desk Otter",description:"A bespectacled desk-worker otter mascot in a blue shirt, animated for Codex task states.",category:"\u52A8\u7269\u4F19\u4F34",author:"zihualiu1997",authorHandle:"zihualiu1997",kind:"pet",atlas:"assets/pets/upstream-20261009/desk-otter--zihualiu1997.webp",thumbnail:"assets/pets/upstream-20261009/desk-otter--zihualiu1997-thumb.webp",version:1,tags:["otter","desk-worker","glasses","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/desk-otter--zihualiu1997",license:"MIT License",download:"assets/pets/upstream-20261009/desk-otter--zihualiu1997.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/desk-otter--zihualiu1997",spritesheetSha256:"e48f36365aab834bcd8f6fd21a21727eced21fb1ff2940bf5e5980bebe85e18e",metadataNameAlias:!1,authorUrl:"https://github.com/zihualiu1997"},{id:"diandian--lllucasxu",title:"Diandian",englishTitle:"Diandian",description:"A calm tabby-and-white cat companion with a sleepy face and gentle curled-up poses.",category:"\u52A8\u7269\u4F19\u4F34",author:"LLLucasXU",authorHandle:"LLLucasXU",kind:"pet",atlas:"assets/pets/upstream-20261009/diandian--lllucasxu.webp",thumbnail:"assets/pets/upstream-20261009/diandian--lllucasxu-thumb.webp",version:1,tags:["cat","tabby","sleepy","calm","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diandian--lllucasxu",license:"MIT License",download:"assets/pets/upstream-20261009/diandian--lllucasxu.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/diandian--lllucasxu",spritesheetSha256:"276cd3263e708dd43ca03919305dd75827b99d0d9012e70a8cf5b4be502714d4",metadataNameAlias:!1,authorUrl:"https://github.com/LLLucasXU"},{id:"diaoyi-baobao--d1a0y1bb",title:"Diaoyi Baobao",englishTitle:"Diaoyi Baobao",description:"A tiny green clover-like companion with a round face and gentle, cheerful expressions.",category:"\u5409\u7965\u7269",author:"D1a0y1bb",authorHandle:"D1a0y1bb",kind:"pet",atlas:"assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.webp",thumbnail:"assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb-thumb.webp",version:1,tags:["clover","green","mascot","cute","round","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diaoyi-baobao--d1a0y1bb",license:"MIT License",download:"assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/diaoyi-baobao--d1a0y1bb",spritesheetSha256:"585e5c3f39021699d7671a450d9e9b77f1f73d0099560fcbdbed2e457a917bc6",metadataNameAlias:!1,authorUrl:"https://github.com/D1a0y1bb"},{id:"doro--lingxiaotian",title:"\u6843\u4E50\u4E1D\uFF08Doro\uFF09",englishTitle:"Doro",description:"A compact Codex digital pet inspired by Doro, the vacant pink-haired Dorothy meme creature from Goddess of Victory: NIKKE.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/doro--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/doro--lingxiaotian-thumb.webp",version:1,tags:["anime","nikke","doro","dorothy","meme","pink-hair"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/doro--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/doro--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["nikke"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/doro--lingxiaotian",spritesheetSha256:"f0661f6f0b1297e54d40a33f0ecfa5c8ef76c88d5b92c4edd7dd76e9ca99872c",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"evanescia-lunar-blossoming--jasdfgh",title:"\u7EEF\u82F1 \xB7 \u6708\u5F85\u82B1\u65F6",englishTitle:"Evanescia \xB7 Lunar Blossoming",description:"\u6C89\u8FF7\u6F2B\u753B\u7684\u8BFB\u8005\uFF0C\u70ED\u8877\u796D\u5178\u7684\u6E38\u5BA2  \uFF0C\u4EA6\u662F\u5E7B\u6708\u6E38\u620F\u7684\u5B88\u62A4\u8005\u3002\u7EEF\u82F1\u6362\u4E0A\u300C\u6708\u5F85\u82B1\u65F6\u300D\uFF0C\u7B11\u91CC\u85CF\u4E09\u5206\u72E1\u9EE0\uFF0C\u8170\u95F4\u60AC\u4E00\u67C4\u5C3A\u5203\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"Jasdfgh",authorHandle:"Jasdfgh",kind:"pet",atlas:"assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.webp",thumbnail:"assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh-thumb.webp",version:2,tags:["honkai-star-rail","anime","chibi","pink"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/evanescia-lunar-blossoming--jasdfgh",license:"CC BY-NC 4.0 for the submitter's licensable contributions; non-commercial use only. Original Honkai: Star Rail / HoYoverse character, outfit, and other third-party intellectual property are excluded. Unofficial fan art; no official affiliation or endorsement.",download:"assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/evanescia-lunar-blossoming--jasdfgh",spritesheetSha256:"b3ffe93e45b846fce1559471f66cb5328994ea6a4c7f72fbb0cc91914a68a072",metadataNameAlias:!1,authorUrl:"https://github.com/Jasdfgh"},{id:"feixiao--lingxiaotian",title:"\u98DE\u9704",englishTitle:"Feixiao",description:"\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u98DE\u9704\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u5C06\u519B\u8F6E\u5ED3\u3001\u9752\u767D\u914D\u8272\u3001\u5229\u843D\u8FD0\u52A8\u59FF\u6001\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/feixiao--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/feixiao--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","feixiao","teal","general"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/feixiao--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/feixiao--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/feixiao--lingxiaotian",spritesheetSha256:"7ad0f3f3561e8056b195b11e95090fb228b9bcb0fb3958725ce1380d4353f7e1",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"fleta--natewanggg",title:"Fleta",englishTitle:"Fleta",description:"A cute pixel-art-adjacent Codex pet based on Fleta, a plush silver-white cat with round cheeks, big blue-gray eyes, tiny paws, and soft gray shading.",category:"\u52A8\u7269\u4F19\u4F34",author:"NateWanggg",authorHandle:"NateWanggg",kind:"pet",atlas:"assets/pets/upstream-20261009/fleta--natewanggg.webp",thumbnail:"assets/pets/upstream-20261009/fleta--natewanggg-thumb.webp",version:1,tags:["cat","silver-white","fleta","original-pet","soft"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/fleta--natewanggg",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/fleta--natewanggg.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/fleta--natewanggg",spritesheetSha256:"e50eaf9d33e425fee880de1a7715606a729f478ca926def0ead5f3e8240e3a2d",metadataNameAlias:!1,authorUrl:"https://github.com/NateWanggg"},{id:"frankie--aygunvarol",title:"Frankie",englishTitle:"Frankie",description:"A cute sausage dog companion with a long dachshund body, floppy ears, and bright friendly eyes.",category:"\u52A8\u7269\u4F19\u4F34",author:"Aygun Varol",authorHandle:"AygunVarol",kind:"pet",atlas:"assets/pets/upstream-20261009/frankie--aygunvarol.webp",thumbnail:"assets/pets/upstream-20261009/frankie--aygunvarol-thumb.webp",version:1,tags:["dachshund","dog","sausage-dog","cute","brown","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frankie--aygunvarol",license:"MIT License",download:"assets/pets/upstream-20261009/frankie--aygunvarol.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/frankie--aygunvarol",spritesheetSha256:"93d4bd6c9cb42ca7a18a71cbe2ee3587a2a8973f41a8d65e760f1328879e8aa1",metadataNameAlias:!1,authorUrl:"https://github.com/AygunVarol"},{id:"frieren--lingxiaotian",title:"\u8299\u8389\u83B2",englishTitle:"Frieren",description:"A compact Codex digital pet inspired by Frieren, a calm elven mage companion.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/frieren--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/frieren--lingxiaotian-thumb.webp",version:1,tags:["anime","elf","mage","fantasy","frieren"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frieren--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/frieren--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["frieren"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/frieren--lingxiaotian",spritesheetSha256:"539f740b954e499ffd56f837cfe0afe4a522e56fe9c9dde134f50b7252a4a7b9",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"furina--lingxiaotian",title:"\u8299\u5B81\u5A1C",englishTitle:"Furina",description:"\u300A\u539F\u795E\u300B\u8299\u5B81\u5A1C\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u84DD\u767D\u793C\u5E3D\u3001\u821E\u53F0\u611F\u548C\u4FCF\u76AE\u620F\u5267\u8868\u60C5\u3002.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/furina--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/furina--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","furina","fontaine","theatrical"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/furina--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/furina--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/furina--lingxiaotian",spritesheetSha256:"91cb4fbb0dc747783e83cb6d09e58476c6adc7d53dd8294c1d609e975c93b99a",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"golden-lamp--legeling",title:"Golden Lamp",englishTitle:"Golden Lamp",description:"An AI-generated golden-lamp sprite based on the reference supplied in request #149. Sprite-only lamp interpretation; the intended request subject and remaining request scope are unresolved pending requester confirmation.",category:"\u5176\u4ED6",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/golden-lamp--legeling.webp",thumbnail:"assets/pets/upstream-20261009/golden-lamp--legeling-thumb.webp",version:2,tags:["gold-lamp","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/golden-lamp--legeling",license:"CC BY-NC 4.0. Non-commercial use only; commercial use is prohibited. Rights in the requester-supplied reference image and any depicted or referenced characters remain with their respective rights holders. This is an unofficial AI-generated community interpretation.",download:"assets/pets/upstream-20261009/golden-lamp--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/golden-lamp--legeling",spritesheetSha256:"bad38befd0eaccf0ce9f96adfc08eced1a1cd9d865317dffbdc40efb51539024",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"hajimi--zeyuwang1999",title:"Hajimi",englishTitle:"Hajimi",description:"A cute purple-haired cat-eared companion with soft expressions and Codex-optimized desktop-pet animations.",category:"\u539F\u521B\u89D2\u8272",author:"zeyu.wang",authorHandle:"zeyuwang1999",kind:"pet",atlas:"assets/pets/upstream-20261009/hajimi--zeyuwang1999.webp",thumbnail:"assets/pets/upstream-20261009/hajimi--zeyuwang1999-thumb.webp",version:1,tags:["hajimi","cat-ears","purple","cute","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hajimi--zeyuwang1999",license:"MIT License",download:"assets/pets/upstream-20261009/hajimi--zeyuwang1999.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hajimi--zeyuwang1999",spritesheetSha256:"0a203ff15f0cdd503b54743c5d27c4d67c355c2359f91ceedacf449493e11a4f",metadataNameAlias:!1,authorUrl:"https://github.com/zeyuwang1999"},{id:"hana2--initiatione",title:"Hana2",englishTitle:"Hana2",description:"A refined kimono-style Hana pixel pet with gentle expressions, floral details, and calm desktop-pet animations.",category:"\u539F\u521B\u89D2\u8272",author:"initiatione",authorHandle:"initiatione",kind:"pet",atlas:"assets/pets/upstream-20261009/hana2--initiatione.webp",thumbnail:"assets/pets/upstream-20261009/hana2--initiatione-thumb.webp",version:1,tags:["hana","kimono","pixel-art","gentle","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hana2--initiatione",license:"MIT License",download:"assets/pets/upstream-20261009/hana2--initiatione.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hana2--initiatione",spritesheetSha256:"ddbc017778f7824709cc0b9d2774022c18486b4449f47073891e406b2e5712af",metadataNameAlias:!1,authorUrl:"https://github.com/initiatione"},{id:"hu-tao--lingxiaotian",title:"\u80E1\u6843",englishTitle:"Hu Tao",description:"\u300A\u539F\u795E\u300B\u80E1\u6843\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u5F80\u751F\u5802\u5E3D\u5B50\u3001\u6885\u82B1\u773C\u4E0E\u4FCF\u76AE\u7075\u52A8\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/hu-tao--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/hu-tao--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","hu-tao","black-red","playful"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hu-tao--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/hu-tao--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hu-tao--lingxiaotian",spritesheetSha256:"9dc7651a1d8b7074ff9d506ef57059805b6c3e23d15841dc54199292c7fce183",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"iris--yau-427",title:"Iris",englishTitle:"Iris",description:"A cheerful manga-pop companion who works at her laptop inside a chunky neon terminal window.",category:"\u539F\u521B\u89D2\u8272",author:"Yau-427",authorHandle:"Yau-427",kind:"pet",atlas:"assets/pets/upstream-20261009/iris--yau-427.webp",thumbnail:"assets/pets/upstream-20261009/iris--yau-427-thumb.webp",version:2,tags:["anime","manga-pop","cyberpunk","neon","coding","terminal","coffee","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iris--yau-427",license:"MIT License; original AI-assisted artwork submitted by Yau-427 with redistribution permission.",download:"assets/pets/upstream-20261009/iris--yau-427.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/iris--yau-427",spritesheetSha256:"9549db84e558ecc3477853c95b81a84f50447ccd32566ff5cf22520f2785b9da",metadataNameAlias:!1,authorUrl:"https://github.com/Yau-427"},{id:"isekaijoucho--siiverash",title:"Isekaijoucho",englishTitle:"Isekaijoucho",description:"An Isekaijoucho-inspired fan-art Codex pet with long wavy silver hair, a vivid blue flower ornament, a white-and-ice-blue dress palette, and a compact chibi pixel sprite identity.",category:"\u52A8\u6F2B\u89D2\u8272",author:"SiIverAsh",authorHandle:"SiIverAsh",kind:"pet",atlas:"assets/pets/upstream-20261009/isekaijoucho--siiverash.webp",thumbnail:"assets/pets/upstream-20261009/isekaijoucho--siiverash-thumb.webp",version:1,tags:["kamitsubaki-studio","isekaijoucho","virtual-singer","pixel-art","hatch-pet"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/isekaijoucho--siiverash",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/isekaijoucho--siiverash.zip",date:"",importedAt:"2026-10-09",collections:["kamitsubaki-studio"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/isekaijoucho--siiverash",spritesheetSha256:"6863ba09b86a8a8f50bdf90e07ac149ea0c9269c1e2e6323b60d29dfd58cb2a1",metadataNameAlias:!1,authorUrl:"https://github.com/SiIverAsh"},{id:"joker--oytyo",title:"Joker",englishTitle:"Joker",description:"A pixel-art theatrical card trickster in a tailored purple-black suit with green-black hair, painted eyes, playing-card animations, and 16-way looking directions.",category:"\u539F\u521B\u89D2\u8272",author:"oYTYo",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/joker--oytyo.webp",thumbnail:"assets/pets/upstream-20261009/joker--oytyo-thumb.webp",version:2,tags:["pixel-art","card-trickster","theatrical","playing-cards"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/joker--oytyo",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/joker--oytyo.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/joker--oytyo",spritesheetSha256:"39b74779641dd5cbe1947ee1f1463c8fbeffc66e8793c014696bbe67935f1cef",metadataNameAlias:!1},{id:"kamisato-ayaka--lingxiaotian",title:"\u795E\u91CC\u7EEB\u534E",englishTitle:"Kamisato Ayaka",description:"\u300A\u539F\u795E\u300B\u795E\u91CC\u7EEB\u534E\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u84DD\u767D\u914D\u8272\u3001\u516C\u4E3B\u5207\u8F6E\u5ED3\u4E0E\u5B89\u9759\u4F18\u96C5\u7684\u7A3B\u59BB\u5927\u5C0F\u59D0\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","kamisato-ayaka","cryo","blue"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kamisato-ayaka--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/kamisato-ayaka--lingxiaotian",spritesheetSha256:"2e4a779f8a1d8c8ab4199d4ccf4f0f609bd1307323bfea7005bf5b73fe259f58",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"katana-cheems--thankyou-cheems",title:"Katana Cheems",englishTitle:"Katana Cheems",description:"A pixel-art Cheems pet wearing a straw hat, carrying a tiny katana, and crying a blue meme tear when a Codex task fails.",category:"\u7F51\u7EDC\u6897\u56FE",author:"Thankyou-Cheems",authorHandle:"Thankyou-Cheems",kind:"pet",atlas:"assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.webp",thumbnail:"assets/pets/upstream-20261009/katana-cheems--thankyou-cheems-thumb.webp",version:1,tags:["cheems","dog","shiba","katana","straw-hat","pixel-art","meme","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/katana-cheems--thankyou-cheems",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/katana-cheems--thankyou-cheems",spritesheetSha256:"467ada74e238f6b27b85a010e6825eb0e3e8dd864d9f0143849e60301bd9498e",metadataNameAlias:!1,authorUrl:"https://github.com/Thankyou-Cheems"},{id:"kiko--untko",title:"Kiko",englishTitle:"Kiko",description:"A cheerful color-changing gecko companion with expressive animations and curious eyes.",category:"\u52A8\u7269\u4F19\u4F34",author:"untko",authorHandle:"untko",kind:"pet",atlas:"assets/pets/upstream-20261009/kiko--untko.webp",thumbnail:"assets/pets/upstream-20261009/kiko--untko-thumb.webp",version:2,tags:["gecko","animal","3d-toy","color-changing","expressive","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kiko--untko",license:"CC BY-NC 4.0. The creator owns or controls the Kiko artwork and authorizes its redistribution and modification under CC BY-NC 4.0, without warranty.",download:"assets/pets/upstream-20261009/kiko--untko.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/kiko--untko",spritesheetSha256:"dadeab52face9c15e29a9e5e28ae3860b9634ebf4ce7aca42b59c484bd6f3a2f",metadataNameAlias:!1,authorUrl:"https://github.com/untko"},{id:"kurimanju--legeling",title:"\u6817\u5B50\u9992\u5934",englishTitle:"Kurimanju",description:"The flushed brown-crowned Chiikawa character with four blush strokes on each cheek.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/kurimanju--legeling.webp",thumbnail:"assets/pets/upstream-20261009/kurimanju--legeling-thumb.webp",version:2,tags:["community-request","chiikawa","kurimanju"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kurimanju--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/kurimanju--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/kurimanju--legeling",spritesheetSha256:"aeba2fd4e4e9290c8f794decf68563176bef816e313d0cafc6e30c6ef1122cb2",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"lil-swole--gg0805",title:"Lil Swole",englishTitle:"Lil Swole",description:"A cultured, gloriously brainrotted gym-rat icon who curls a computer mouse while his parrot wingman launches dumbbells.",category:"\u52A8\u7269\u4F19\u4F34",author:"gg0805",authorHandle:"gg0805",kind:"pet",atlas:"assets/pets/upstream-20261009/lil-swole--gg0805.webp",thumbnail:"assets/pets/upstream-20261009/lil-swole--gg0805-thumb.webp",version:2,tags:["rat","gym","streetwear","parrot","sticker","original","codex-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lil-swole--gg0805",license:"CC BY-NC 4.0. Original AI-generated artwork created for and submitted by gg0805; no third-party source assets were used.",download:"assets/pets/upstream-20261009/lil-swole--gg0805.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/lil-swole--gg0805",spritesheetSha256:"3ef92b0f66ab097c75b2e9f5bb03c299c4140e20fe0802228f2c5f3fd2bcf810",metadataNameAlias:!1,authorUrl:"https://github.com/gg0805"},{id:"little-sheep--mingdong",title:"Little Sheep",englishTitle:"Little Sheep",description:"A fluffy cream sheep with wine-red horns, made as a cozy Codex companion that grazes, waits, and trots in tiny loops.",category:"\u52A8\u7269\u4F19\u4F34",author:"MingDong",authorHandle:"MingDong",kind:"pet",atlas:"assets/pets/upstream-20261009/little-sheep--mingdong.webp",thumbnail:"assets/pets/upstream-20261009/little-sheep--mingdong-thumb.webp",version:1,tags:["sheep","animal","fluffy","wine-red-horns","cozy"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-sheep--mingdong",license:"CC BY-NC 4.0. Original AI-assisted asset created by MingDong for Codex pet submission; no third-party source asset.",download:"assets/pets/upstream-20261009/little-sheep--mingdong.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/little-sheep--mingdong",spritesheetSha256:"af80e8c26246720152ce425c44b3e10606df56351477e916044103832a0248b3",metadataNameAlias:!1},{id:"lulu--yogazz",title:"Lulu",englishTitle:"Lulu",description:"A cheerful rounded yellow-orange 3D toy companion for Codex.",category:"\u5409\u7965\u7269",author:"YoGazz",authorHandle:"YoGazz",kind:"pet",atlas:"assets/pets/upstream-20261009/lulu--yogazz.webp",thumbnail:"assets/pets/upstream-20261009/lulu--yogazz-thumb.webp",version:1,tags:["original","3d-toy","yellow-orange","codex-pet"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lulu--yogazz",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/lulu--yogazz.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/lulu--yogazz",spritesheetSha256:"459bf8ce95e855331bdd81de48b8466a46a1df72e6fdef45a77213eda89373a3",metadataNameAlias:!1,authorUrl:"https://github.com/YoGazz"},{id:"mahiro--lingxiaotian",title:"\u7EEA\u5C71\u771F\u5BFB",englishTitle:"Mahiro",description:"A shy Codex digital pet inspired by Mahiro Oyama from ONIMAI, wearing an oversized off-shoulder summer shirt.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/mahiro--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/mahiro--lingxiaotian-thumb.webp",version:1,tags:["anime","onimai","mahiro","oyama-mahiro","off-shoulder"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mahiro--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/mahiro--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["onimai"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mahiro--lingxiaotian",spritesheetSha256:"a9222f3db52ff004814e12897baee2c2b86240749526de45ec418c21125156ec",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"mai--dwdestiny",title:"Mai",englishTitle:"Mai",description:"A cool and fluffy white bichon-style puppy boss with round sunglasses, an orange bow tie, and playful work animations.",category:"\u52A8\u7269\u4F19\u4F34",author:"DwDestiny",authorHandle:"DwDestiny",kind:"pet",atlas:"assets/pets/upstream-20261009/mai--dwdestiny.webp",thumbnail:"assets/pets/upstream-20261009/mai--dwdestiny-thumb.webp",version:1,tags:["dog","bichon","puppy","sunglasses","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mai--dwdestiny",license:"MIT License",download:"assets/pets/upstream-20261009/mai--dwdestiny.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mai--dwdestiny",spritesheetSha256:"dde0f307bd046cd5f9bd72103bfcac22c4b2f892a002e6bad545aa5132ebc697",metadataNameAlias:!1,authorUrl:"https://github.com/DwDestiny"},{id:"mihari--hyoni1129",title:"Mihari",englishTitle:"Mihari",description:"Unofficial fan-made Codex pet inspired by Mihari Oyama from ONIMAI, adapted as a tiny caring chibi pixel-art lab assistant with smoother directional motion, notebook task-processing, and clipboard review states.",category:"\u52A8\u6F2B\u89D2\u8272",author:"Jeonghan Lee (@Hyoni1129)",authorHandle:"Hyoni1129",kind:"pet",atlas:"assets/pets/upstream-20261009/mihari--hyoni1129.webp",thumbnail:"assets/pets/upstream-20261009/mihari--hyoni1129-thumb.webp",version:1,tags:["anime","onimai","mihari","scientist","lab-coat","fan-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mihari--hyoni1129",license:"CC BY-NC 4.0; unofficial fan-made non-commercial pet; no official ONIMAI artwork, screenshots, logos, or source assets are included; underlying character rights belong to their respective rights holders.",download:"assets/pets/upstream-20261009/mihari--hyoni1129.zip",date:"",importedAt:"2026-10-09",collections:["onimai"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mihari--hyoni1129",spritesheetSha256:"edc0709882db81345f6365eec499cdef9f67cb76876284228f367c662ff69e68",metadataNameAlias:!1,authorUrl:"https://github.com/Hyoni1129"},{id:"mika--rotl24",title:"Mika",englishTitle:"Mika",description:"A cozy long-haired chibi companion in headphones, scarf, and school-style winter clothes.",category:"\u539F\u521B\u89D2\u8272",author:"ROTl24",authorHandle:"ROTl24",kind:"pet",atlas:"assets/pets/upstream-20261009/mika--rotl24.webp",thumbnail:"assets/pets/upstream-20261009/mika--rotl24-thumb.webp",version:1,tags:["mika","chibi","headphones","winter","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mika--rotl24",license:"MIT License",download:"assets/pets/upstream-20261009/mika--rotl24.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mika--rotl24",spritesheetSha256:"5b0f19306e0a4d12393875004bf700dd5cf35d59a1d3c14bc31cc4a8062e2f9c",metadataNameAlias:!1,authorUrl:"https://github.com/ROTl24"},{id:"mikoto--lingxiaotian",title:"\u5FA1\u5742\u7F8E\u7434",englishTitle:"Mikoto",description:"A chibi electric schoolgirl Codex pet with coin tricks inspired by Misaka Mikoto.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/mikoto--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/mikoto--lingxiaotian-thumb.webp",version:1,tags:["anime","a-certain-scientific-railgun","electric","schoolgirl","misaka-mikoto"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mikoto--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/mikoto--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["a-certain-scientific-railgun"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mikoto--lingxiaotian",spritesheetSha256:"1765adf93fd65916a6f1cae8670d8df0afa30231fc8214999c98ebefb0a4c5c2",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"miku--lingxiaotian",title:"\u521D\u97F3\u672A\u6765",englishTitle:"Miku",description:"A compact Codex digital pet inspired by Hatsune Miku, a bright virtual idol singer.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/miku--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/miku--lingxiaotian-thumb.webp",version:1,tags:["anime","virtual-idol","teal-hair","twintails","miku"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/miku--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/miku--lingxiaotian",spritesheetSha256:"6212ca761be1278b1dbcba214e2c8a0f637f0b526eb4e3692994f74e750e502c",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"mimi--spacebody",title:"Mimi",englishTitle:"Mimi",description:"A silver tabby American Shorthair kitten companion with bright green eyes and playful desktop-pet motions.",category:"\u52A8\u7269\u4F19\u4F34",author:"Jerry",authorHandle:"Spacebody",kind:"pet",atlas:"assets/pets/upstream-20261009/mimi--spacebody.webp",thumbnail:"assets/pets/upstream-20261009/mimi--spacebody-thumb.webp",version:1,tags:["cat","kitten","tabby","cute","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mimi--spacebody",license:"MIT License",download:"assets/pets/upstream-20261009/mimi--spacebody.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mimi--spacebody",spritesheetSha256:"f8acfb98b864a717a5876fc7a4ce696b2bced4998c62b913b4ddec30721760a0",metadataNameAlias:!1,authorUrl:"https://github.com/Spacebody"},{id:"minty--somnusochi",title:"Minty",englishTitle:"Minty",description:"A mint-haired animated companion with nine activity animations and sixteen v2 look directions.",category:"\u539F\u521B\u89D2\u8272",author:"Somnusochi",authorHandle:"Somnusochi",kind:"pet",atlas:"assets/pets/upstream-20261009/minty--somnusochi.webp",thumbnail:"assets/pets/upstream-20261009/minty--somnusochi-thumb.webp",version:2,tags:["mint","anime","look-directions","pixel-art","codex-v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/minty--somnusochi",license:"MIT License",download:"assets/pets/upstream-20261009/minty--somnusochi.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/minty--somnusochi",spritesheetSha256:"f50fa768ae82a9874a9429174d0dc69f35ff0937f827a1f5805317ca3a6f4d89",metadataNameAlias:!1,authorUrl:"https://github.com/Somnusochi"},{id:"misaka-network--ldl1234",title:"\u5FA1\u5742\u7F51\u7EDC",englishTitle:"Misaka Network",description:"\u5FA1\u5742\u7F51\u7EDC\u98CE\u683C\u7684 v2 Codex \u50CF\u7D20\u5BA0\u7269\uFF0C\u7A7F\u7C73\u8272\u6821\u670D\u5916\u5957\u3001\u7EA2\u9886\u7ED3\u4E0E\u84DD\u7070\u683C\u88D9\uFF0C\u4FDD\u7559\u9ED1\u732B\u3001\u673A\u68B0\u88C5\u5907\u3001\u7535\u6D41\u548C\u5DE8\u5927\u98CE\u673A\u6548\u679C\uFF0C\u5E76\u652F\u6301 16 \u4E2A\u73AF\u89C6\u65B9\u5411\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"LyuDonglian",authorHandle:"ldl1234",kind:"pet",atlas:"assets/pets/upstream-20261009/misaka-network--ldl1234.webp",thumbnail:"assets/pets/upstream-20261009/misaka-network--ldl1234-thumb.webp",version:2,tags:["anime","a-certain-scientific-railgun","electric","schoolgirl","misaka-network","pixel-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/misaka-network--ldl1234",license:"MIT",download:"assets/pets/upstream-20261009/misaka-network--ldl1234.zip",date:"",importedAt:"2026-10-09",collections:["a-certain-scientific-railgun"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/misaka-network--ldl1234",spritesheetSha256:"18f63c26660ab453cf0f575c9c8c3a82b125121adb53821602bb1884ab4ef44b",metadataNameAlias:!1,authorUrl:"https://github.com/ldl1234"},{id:"missile--zpzjzj",title:"Missile",englishTitle:"Missile",description:"An energetic orange Pomeranian inspired by Ghost Trick's loyal Missile, with a huge cream ruff, curled plume tail, and joyful expression.",category:"\u6E38\u620F\u89D2\u8272",author:"Ping",authorHandle:"zpzjzj",kind:"pet",atlas:"assets/pets/upstream-20261009/missile--zpzjzj.webp",thumbnail:"assets/pets/upstream-20261009/missile--zpzjzj-thumb.webp",version:2,tags:["ghost-trick","missile","dog","pomeranian","flat-vector"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/missile--zpzjzj",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/missile--zpzjzj.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/missile--zpzjzj",spritesheetSha256:"007969983fc73bb30e601713e61bc25bf78f3590b5ae432f755d39d3efc619cb",metadataNameAlias:!1,authorUrl:"https://github.com/zpzjzj"},{id:"my-little-orange-cat--zhou-jianwen",title:"My Little Orange Cat",englishTitle:"My Little Orange Cat",description:"A softly illustrated orange-and-white cat inspired by community request #179.",category:"\u5176\u4ED6",author:"zhou-jianwen",authorHandle:"zhou-jianwen",kind:"pet",atlas:"assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.webp",thumbnail:"assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen-thumb.webp",version:2,tags:["cat","community-request"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/my-little-orange-cat--zhou-jianwen",license:"Non-commercial use and redistribution only, with credit to zhou-jianwen for this AI-assisted pet contribution. Commercial use is prohibited. No ownership or license over the submitted reference photograph is asserted or granted.",download:"assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/my-little-orange-cat--zhou-jianwen",spritesheetSha256:"90f70801768beef9a0d9d66a28371c0e9e7635b40eed27d96fd6427c56975ec4",metadataNameAlias:!1,authorUrl:"https://github.com/zhou-jianwen"},{id:"nahida--lingxiaotian",title:"\u7EB3\u897F\u59B2",englishTitle:"Nahida",description:"\u300A\u539F\u795E\u300B\u7EB3\u897F\u59B2\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u767D\u7EFF\u914D\u8272\u3001\u53F6\u9970\u8F6E\u5ED3\u4E0E\u8F7B\u76C8\u6E29\u67D4\u7684\u68EE\u6797\u7CBE\u7075\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/nahida--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/nahida--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","nahida","dendro","green"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nahida--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/nahida--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/nahida--lingxiaotian",spritesheetSha256:"ee20f2d7996c296be86895af0413e02adfaf81705ff6373927cab39d394b8ebb",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"navia--lingxiaotian",title:"\u5A1C\u7EF4\u5A05",englishTitle:"Navia",description:"\u300A\u539F\u795E\u300B\u5A1C\u7EF4\u5A05\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9EC4\u9ED1\u793C\u670D\u3001\u5BBD\u6A90\u5E3D\u4E0E\u660E\u4EAE\u5927\u5C0F\u59D0\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/navia--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/navia--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","navia","gold","elegant"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/navia--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/navia--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/navia--lingxiaotian",spritesheetSha256:"daf0ad82f6ebd07e32e6a6833e6a7eb2465520cf05080959d66d8db624955052",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"night-neko--netizenxuan",title:"Night Neko",englishTitle:"Night Neko",description:"A white cat-demon desktop companion with sleepy eyes, red-black bat wings, gothic stripes, one fluffy tail, and late-night coding energy.",category:"\u5E7B\u60F3\u751F\u7269",author:"netizenXuan",authorHandle:"netizenXuan",kind:"pet",atlas:"assets/pets/upstream-20261009/night-neko--netizenxuan.webp",thumbnail:"assets/pets/upstream-20261009/night-neko--netizenxuan-thumb.webp",version:1,tags:["cat","demon","gothic","night","coding","cyberpunk","chibi"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/night-neko--netizenxuan",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/night-neko--netizenxuan.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/night-neko--netizenxuan",spritesheetSha256:"0762cd9a14129b765a030fe5a35785faa2d6e466fb080a7607e42a6bd765c4a2",metadataNameAlias:!1,authorUrl:"https://github.com/netizenXuan"},{id:"niu-lai--wynn",title:"Niu Lai",englishTitle:"Niu Lai",description:"An unofficial, AI-generated Niu Lai fan-art calf companion, patient during approvals and curious during research.",category:"\u52A8\u6F2B\u89D2\u8272",author:"wynn",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/niu-lai--wynn.webp",thumbnail:"assets/pets/upstream-20261009/niu-lai--wynn-thumb.webp",version:2,tags:["fan-art","3d","ai-generated","orange","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niu-lai--wynn",license:"Non-commercial use and redistribution only, with credit to wynn, to the extent wynn holds rights in this contribution. The underlying Niu Lai film character and reference imagery remain subject to third-party rights; no permission from their rightsholders is asserted or granted. Unofficial fan art; no affiliation or endorsement. These terms do not establish third-party rights clearance.",download:"assets/pets/upstream-20261009/niu-lai--wynn.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/niu-lai--wynn",spritesheetSha256:"75b1809e88d6e4bebcb040f9a3dcffdb1eed1964dd86366527bb95ea7d26b575",metadataNameAlias:!1,authorUrl:"https://github.com/zhou-jianwen"},{id:"paimon--lingxiaotian",title:"\u6D3E\u8499",englishTitle:"Paimon",description:"A compact Codex digital pet inspired by Paimon, the floating companion from Genshin Impact.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/paimon--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/paimon--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","paimon","floating-companion","white-hair"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/paimon--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/paimon--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/paimon--lingxiaotian",spritesheetSha256:"489946a931de1f561c50d2e6941c82707d5703b6073b5169b6bc5c607459aea6",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"panda--jason-bai",title:"Panda",englishTitle:"Panda",description:"A soft, healing panda companion with round eyes, tiny paws, and gentle calming poses.",category:"\u52A8\u7269\u4F19\u4F34",author:"Jason Bai",authorHandle:"Jason-Bai",kind:"pet",atlas:"assets/pets/upstream-20261009/panda--jason-bai.webp",thumbnail:"assets/pets/upstream-20261009/panda--jason-bai-thumb.webp",version:1,tags:["panda","soft","healing","cute","gentle","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/panda--jason-bai",license:"MIT License",download:"assets/pets/upstream-20261009/panda--jason-bai.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/panda--jason-bai",spritesheetSha256:"a7c9d21f98af24566daa8fbbd67b65e6b48572eec885165d7b86c5a4311fb325",metadataNameAlias:!1,authorUrl:"https://github.com/Jason-Bai"},{id:"pixel-duck--flamurmaliqi",title:"Pixel Duck",englishTitle:"Pixel Duck",description:"An original pixel duck that spins through the same eight-frame loop in every Codex state.",category:"\u52A8\u7269\u4F19\u4F34",author:"Flamur Maliqi",authorHandle:"FlamurMaliqi",kind:"pet",atlas:"assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.webp",thumbnail:"assets/pets/upstream-20261009/pixel-duck--flamurmaliqi-thumb.webp",version:1,tags:["duck","pixel-art","spin","codex-pets"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/pixel-duck--flamurmaliqi",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/pixel-duck--flamurmaliqi",spritesheetSha256:"88ca26717528fe1d01fcba2a649cc5633e40ea886e3b028ffab25654787a87da",metadataNameAlias:!1,authorUrl:"https://github.com/FlamurMaliqi"},{id:"potato--legeling",title:"Potato",englishTitle:"Potato",description:"A plain ochre pixel potato with a stepped outline and gentle organic movements.",category:"\u7269\u4EF6\u4E0E\u9053\u5177",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/potato--legeling.webp",thumbnail:"assets/pets/upstream-20261009/potato--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/potato--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/potato--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/potato--legeling",spritesheetSha256:"48531925a56a4808f822cccfe6b6e91ec0a4bdc0c70f5270d935e98f273c5d98",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"raiden-shogun--lingxiaotian",title:"\u96F7\u7535\u5C06\u519B",englishTitle:"Raiden Shogun",description:"\u300A\u539F\u795E\u300B\u96F7\u7535\u5C06\u519B\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u8272\u957F\u53D1\u3001\u7535\u5143\u7D20\u7D2B\u5149\u70B9\u7F00\u3001\u548C\u98CE\u670D\u9970\u8F6E\u5ED3\u4E0E\u5A01\u4E25\u51B7\u9759\u7684\u795E\u660E\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/raiden-shogun--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","raiden-shogun","electro","purple"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/raiden-shogun--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/raiden-shogun--lingxiaotian",spritesheetSha256:"5eed45f5082a086facf960007b8cc1fab00abe01c1ebc2fdd1a6dd2e418e8ca4",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"reimu--lingxiaotian",title:"\u535A\u4E3D\u7075\u68A6",englishTitle:"Reimu",description:"A compact Codex digital pet inspired by Hakurei Reimu, a calm shrine maiden from Touhou.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/reimu--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/reimu--lingxiaotian-thumb.webp",version:1,tags:["anime","touhou","touhou-project","shrine-maiden","reimu","hakurei-reimu"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/reimu--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/reimu--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["touhou-project"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/reimu--lingxiaotian",spritesheetSha256:"b438b769665feb0c2c5c6f87d489af4d7eb3515e89c6ef19222587d4e9cf1677",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"rinami--siiverash",title:"Rinami Himesaki",englishTitle:"Rinami Himesaki",description:"A Rinami Himesaki-inspired fan-art Codex pet with long wavy light-brown hair, crown-braid styling, a navy-and-gold school-uniform palette, and a compact chibi pixel sprite identity.",category:"\u52A8\u6F2B\u89D2\u8272",author:"SiIverAsh",authorHandle:"SiIverAsh",kind:"pet",atlas:"assets/pets/upstream-20261009/rinami--siiverash.webp",thumbnail:"assets/pets/upstream-20261009/rinami--siiverash-thumb.webp",version:1,tags:["gakuen-idolmaster","rinami-himesaki","pixel-art","hatch-pet"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/rinami--siiverash",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/rinami--siiverash.zip",date:"",importedAt:"2026-10-09",collections:["gakuen-idolmaster"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/rinami--siiverash",spritesheetSha256:"1547fb38ec66c26f0426984e0efe5c051febf11d78250695e4defa13c9fa1f75",metadataNameAlias:!1,authorUrl:"https://github.com/SiIverAsh"},{id:"robin--lingxiaotian",title:"\u77E5\u66F4\u9E1F",englishTitle:"Robin",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u77E5\u66F4\u9E1F\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u6D45\u84DD\u767D\u793C\u670D\u3001\u5206\u53C9\u91D1\u8272\u5149\u73AF\u4E0E\u6B4C\u59EC\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/robin--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/robin--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","robin","angelic","blue"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/robin--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/robin--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/robin--lingxiaotian",spritesheetSha256:"2a34d75d2aab0385b12d9b920c9aa30e6804dd74505eebc08308715459a6ca8b",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"ruan-mei--lingxiaotian",title:"\u962E\xB7\u6885",englishTitle:"Ruan Mei",description:"\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u962E\u6885\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9752\u7EFF\u6E10\u53D8\u3001\u6885\u82B1/\u7434\u5F26\u611F\u3001\u51B7\u9759\u8868\u60C5\u3002.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/ruan-mei--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/ruan-mei--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","ruan-mei","teal","elegant"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruan-mei--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/ruan-mei--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/ruan-mei--lingxiaotian",spritesheetSha256:"829c613e78e4c9b3b0e727984f1077ca88c98e17c16a219837ebdd258ed7ad05",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"ruruka--ltmcliao-cmyk",title:"RuRuKa",englishTitle:"RuRuKa",description:"RuRuKa is a 3D-style black-and-cream glasses companion with expressive Codex workflow animations.",category:"\u539F\u521B\u89D2\u8272",author:"ltmcliao-cmyk",authorHandle:"ltmcliao-cmyk",kind:"pet",atlas:"assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.webp",thumbnail:"assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk-thumb.webp",version:1,tags:["ruruka","3d","glasses","animated","codex","workflow"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruruka--ltmcliao-cmyk",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/ruruka--ltmcliao-cmyk",spritesheetSha256:"9bec1eb0abf2ba4c28d397782f64b08ff7cb6aeb4b533338e7989cec6215c55c",metadataNameAlias:!1,authorUrl:"https://github.com/ltmcliao-cmyk"},{id:"saki--rookie-09",title:"Saki",englishTitle:"Saki",description:"A tiny cyan pixel-style Saki mascot with wings, cat ears, and cheerful desktop-pet animations.",category:"\u5409\u7965\u7269",author:"rookie-09",authorHandle:"rookie-09",kind:"pet",atlas:"assets/pets/upstream-20261009/saki--rookie-09.webp",thumbnail:"assets/pets/upstream-20261009/saki--rookie-09-thumb.webp",version:1,tags:["saki","cyan","pixel-art","mascot","wings","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/saki--rookie-09",license:"MIT License",download:"assets/pets/upstream-20261009/saki--rookie-09.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/saki--rookie-09",spritesheetSha256:"61ea42dffd8aaaaa3136450085d122efcdf860fa495a17105ba1559ee17a2148",metadataNameAlias:!1,authorUrl:"https://github.com/rookie-09"},{id:"serge-le-lapin--legeling",title:"Serge le Lapin",englishTitle:"Serge le Lapin",description:"\u4E00\u53EA\u7C89\u8272\u957F\u8033\u3001\u767D\u8272\u53E3\u9F3B\u3001\u9EC4\u4E0A\u8863\u548C\u84DD\u88E4\u5B50\u7684\u6D3B\u6CFC Q \u7248\u5154\u5B50\u4F19\u4F34\u3002",category:"\u5409\u7965\u7269",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/serge-le-lapin--legeling.webp",thumbnail:"assets/pets/upstream-20261009/serge-le-lapin--legeling-thumb.webp",version:2,tags:["serge-le-lapin","community-request","ai-generated","mascot","rabbit","sticker","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/serge-le-lapin--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u76F8\u5173\u89D2\u8272\u6216\u5546\u6807\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/serge-le-lapin--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/serge-le-lapin--legeling",spritesheetSha256:"4087884d17cd353dffe0b73966e26ce144071a907f46935644fe2579b7a74293",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"shian-helper--mistyshen",title:"Shian",englishTitle:"Shian",description:"A soft blonde chibi coding companion with black-and-orange bows and a gentle expression.",category:"\u539F\u521B\u89D2\u8272",author:"mistyShen",authorHandle:"mistyShen",kind:"pet",atlas:"assets/pets/upstream-20261009/shian-helper--mistyshen.webp",thumbnail:"assets/pets/upstream-20261009/shian-helper--mistyshen-thumb.webp",version:1,tags:["shian","blonde","chibi","bows","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shian-helper--mistyshen",license:"MIT License",download:"assets/pets/upstream-20261009/shian-helper--mistyshen.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/shian-helper--mistyshen",spritesheetSha256:"4ddbd7d55353ce292e34afbd570efceeb4cb476c397034ddec98319b99c82d8d",metadataNameAlias:!1,authorUrl:"https://github.com/mistyShen"},{id:"silver-wolf--lingxiaotian",title:"\u94F6\u72FC",englishTitle:"Silver Wolf",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u94F6\u72FC\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u7070\u77ED\u53D1\u3001\u9ED1\u5BA2\u611F\u62A4\u76EE\u955C\u4E0E\u9ED1\u7D2B\u673A\u80FD\u7A7F\u642D\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/silver-wolf--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/silver-wolf--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","silver-wolf","hacker","cyber"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/silver-wolf--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/silver-wolf--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/silver-wolf--lingxiaotian",spritesheetSha256:"6bae5695b739d8503ef5895ba4282e46dcee78dbacf891b50b40d7ef3f237289",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"sparkle--lingxiaotian",title:"\u82B1\u706B",englishTitle:"Sparkle",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u82B1\u706B\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7EA2\u9ED1\u914D\u8272\u3001\u53CC\u9A6C\u5C3E\u3001\u9762\u5177\u548C\u4FCF\u76AE\u620F\u5267\u611F\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/sparkle--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/sparkle--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","sparkle","mask","twin-tails"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sparkle--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/sparkle--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/sparkle--lingxiaotian",spritesheetSha256:"8b55199ed720169f8f50d2eec6c846741f16c706e6bfc181192d1970a51ba4e2",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"st-tibo-reset--wynn",title:"St. Tibo Reset",englishTitle:"St. Tibo Reset",description:"A serene, cross-legged Tibo in green and gold robes, ready to press his big red RESET button and give your work a fresh start.",category:"\u7F51\u7EDC\u6897\u56FE",author:"wynn",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/st-tibo-reset--wynn.webp",thumbnail:"assets/pets/upstream-20261009/st-tibo-reset--wynn-thumb.webp",version:2,tags:["meme","human","3d","green"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/st-tibo-reset--wynn",license:"Non-commercial use and redistribution only, with credit to wynn, to the extent the contributor holds rights in this work. Reference imagery and the depicted person's rights remain with their respective rightsholders and are not licensed by this submission. Unofficial fan art; no affiliation or endorsement is claimed. These terms do not establish third-party rights clearance. Please contact the contributor or maintainers with rights concerns so the submission can be reviewed, revised, or removed.",download:"assets/pets/upstream-20261009/st-tibo-reset--wynn.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/st-tibo-reset--wynn",spritesheetSha256:"812f83e1ca0f93de2cfffa9c29525cfe6f8667d001e8cd106e2164f9de7ce25c",metadataNameAlias:!1},{id:"starcorn--alterhq",title:"Starcorn",englishTitle:"Starcorn",description:"A white chibi unicorn with a multicolor horn and a yellow star marking.",category:"\u5E7B\u60F3\u751F\u7269",author:"Alter",authorHandle:"alterhq",kind:"pet",atlas:"assets/pets/upstream-20261009/starcorn--alterhq.webp",thumbnail:"assets/pets/upstream-20261009/starcorn--alterhq-thumb.webp",version:1,tags:["unicorn","fantasy","creature","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/starcorn--alterhq",license:"MIT License",download:"assets/pets/upstream-20261009/starcorn--alterhq.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/starcorn--alterhq",spritesheetSha256:"d2d91b5339bc46662feddbab643e4fb92278de18281859fb37fcf77cc2a65d66",metadataNameAlias:!1,authorUrl:"https://github.com/alterhq"},{id:"sunny-retriever--legeling",title:"\u6696\u9633\u91D1\u6BDB",englishTitle:"Sunny Retriever",description:"A cheerful honey-gold retriever puppy with a teal collar, expressive task animations, and 16 look directions.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/sunny-retriever--legeling.webp",thumbnail:"assets/pets/upstream-20261009/sunny-retriever--legeling-thumb.webp",version:2,tags:["golden-retriever","dog","puppy","teal-collar","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sunny-retriever--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/sunny-retriever--legeling.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/sunny-retriever--legeling",spritesheetSha256:"447a79a275ba01fcef5805c5e4ec3dccce7d8836e0492af28fb81a5ce7898ee0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"tangdouren--carl312",title:"Tangdouren",englishTitle:"Tangdouren",description:"A chibi big-headed girl pet with side-parted brown bob hair and glossy eyes.",category:"\u4EBA\u7269\u5934\u50CF",author:"Carl-312",authorHandle:"Carl-312",kind:"pet",atlas:"assets/pets/upstream-20261009/tangdouren--carl312.webp",thumbnail:"assets/pets/upstream-20261009/tangdouren--carl312-thumb.webp",version:1,tags:["chibi","person","brown-hair","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tangdouren--carl312",license:"MIT License",download:"assets/pets/upstream-20261009/tangdouren--carl312.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tangdouren--carl312",spritesheetSha256:"216b994b833f54fef6f719c6c42e116e666fa7d7d2b40f31f5d2acb872a8411a",metadataNameAlias:!1,authorUrl:"https://github.com/Carl-312"},{id:"tian-hua-hua--d1a0y1bb",title:"Tian Hua Hua",englishTitle:"Tian Hua Hua",description:"A round calico cat companion with sleepy eyes and a calm, slightly serious expression.",category:"\u52A8\u7269\u4F19\u4F34",author:"D1a0y1bb",authorHandle:"D1a0y1bb",kind:"pet",atlas:"assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.webp",thumbnail:"assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb-thumb.webp",version:1,tags:["cat","calico","round","sleepy","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tian-hua-hua--d1a0y1bb",license:"MIT License",download:"assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tian-hua-hua--d1a0y1bb",spritesheetSha256:"5aaa783e17577b92ebdfd2070c95916245be0c378ac6931ef7fa98bb99cb6dc6",metadataNameAlias:!1,authorUrl:"https://github.com/D1a0y1bb"},{id:"tingyun--lingxiaotian",title:"\u505C\u4E91",englishTitle:"Tingyun",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u505C\u4E91\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u72D0\u8033\u4E0E\u5927\u5C3E\u5DF4\u3001\u91D1\u68D5\u7EA2\u914D\u8272\u3001\u7EFF\u773C\u548C\u6E29\u67D4\u4F18\u96C5\u7684\u795E\u6001\u90FD\u88AB\u538B\u7F29\u8FDB\u5C0F\u4F53\u91CF\u52A8\u753B\u91CC\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/tingyun--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/tingyun--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","tingyun","fox-ears","gold-brown"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tingyun--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/tingyun--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tingyun--lingxiaotian",spritesheetSha256:"18c19bc5f493c11f37b83f0d2a2bb861525ab1adf3b05eaba407c1fd9210796a",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"wally--wally025",title:"Wally",englishTitle:"Wally",description:"A cheerful little white guide mascot for builds, reviews, and clean progress.",category:"\u5409\u7965\u7269",author:"Wally Pet Contributors",authorHandle:"wally025",kind:"pet",atlas:"assets/pets/upstream-20261009/wally--wally025.webp",thumbnail:"assets/pets/upstream-20261009/wally--wally025-thumb.webp",version:1,tags:["wally","mascot","white","guide","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/wally--wally025",license:"MIT License",download:"assets/pets/upstream-20261009/wally--wally025.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/wally--wally025",spritesheetSha256:"f9b7d6dd1f9ab97f94d83b78b05f1246fc7c73b9c3c4678fd4ae314a41e25483",metadataNameAlias:!1,authorUrl:"https://github.com/wally025"},{id:"warden-codex--jorge-cuevas90003",title:"Warden Codex",englishTitle:"Warden Codex",description:"An original chibi armored guardian in olive-green sci-fi power armor with a gold visor, always carrying his rifle.",category:"\u539F\u521B\u89D2\u8272",author:"Jorge Cuevas",authorHandle:"Jorge-Cuevas90003",kind:"pet",atlas:"assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.webp",thumbnail:"assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003-thumb.webp",version:2,tags:["sci-fi","armored","guardian","chibi","original","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/warden-codex--jorge-cuevas90003",license:"CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge Cuevas; no third-party source assets were used.",download:"assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/warden-codex--jorge-cuevas90003",spritesheetSha256:"7c51b5594653a8934002c8329b50a1b414764261b778aa5541ece7cc89db7285",metadataNameAlias:!1,authorUrl:"https://github.com/Jorge-Cuevas90003"},{id:"xian-xiao-lu--qingyunagi",title:"Xian Xiao Lu",englishTitle:"Xian Xiao Lu",description:"A peaceful little xianxia deer sitting on a cloud with a gourd and fly-whisk.",category:"\u5E7B\u60F3\u751F\u7269",author:"qingyunAGI",authorHandle:"qingyunAGI",kind:"pet",atlas:"assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.webp",thumbnail:"assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi-thumb.webp",version:1,tags:["deer","xianxia","cloud","peaceful","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xian-xiao-lu--qingyunagi",license:"MIT License",download:"assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xian-xiao-lu--qingyunagi",spritesheetSha256:"17bc75e7d3a9c026ce8210572327b89fade9bba490f7b079d6bd3b96805354e1",metadataNameAlias:!1,authorUrl:"https://github.com/qingyunAGI"},{id:"yier--gbn666",title:"Yi Er",englishTitle:"Yi Er",description:"A soft, gentle white chibi desktop pet with dark round ears, pink cheeks, and a shy expression.",category:"\u539F\u521B\u89D2\u8272",author:"Guo Beining",authorHandle:"gbn666",kind:"pet",atlas:"assets/pets/upstream-20261009/yier--gbn666.webp",thumbnail:"assets/pets/upstream-20261009/yier--gbn666-thumb.webp",version:1,tags:["chibi","pixel-art","soft","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yier--gbn666",license:"MIT License",download:"assets/pets/upstream-20261009/yier--gbn666.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yier--gbn666",spritesheetSha256:"5b0a84b5094172d965f82f7ba5962b35fad898274878cb492a3efe98b4c70b15",metadataNameAlias:!1,authorUrl:"https://github.com/gbn666"},{id:"yuanzai--gaming33",title:"Yuanzai",englishTitle:"Yuanzai",description:"A cute cat-headed bee companion with tiny wings, striped colors, and a gentle round face.",category:"\u5E7B\u60F3\u751F\u7269",author:"Gaming33",authorHandle:"Gaming33",kind:"pet",atlas:"assets/pets/upstream-20261009/yuanzai--gaming33.webp",thumbnail:"assets/pets/upstream-20261009/yuanzai--gaming33-thumb.webp",version:1,tags:["cat","bee","striped","cute","round","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanzai--gaming33",license:"MIT License",download:"assets/pets/upstream-20261009/yuanzai--gaming33.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yuanzai--gaming33",spritesheetSha256:"15f11b04440047f6a994e582bd2223454aacf3da86c197069bbfbe8d37101b7d",metadataNameAlias:!1,authorUrl:"https://github.com/Gaming33"},{id:"yuzubou--keseras34938976",title:"Yuzubou",englishTitle:"Yuzubou",description:"A cheerful little yuzu monk in a straw hat, leaf cap, robes, and prayer beads.",category:"\u539F\u521B\u89D2\u8272",author:"Keseras34938976",authorHandle:"Keseras34938976",kind:"pet",atlas:"assets/pets/upstream-20261009/yuzubou--keseras34938976.webp",thumbnail:"assets/pets/upstream-20261009/yuzubou--keseras34938976-thumb.webp",version:1,tags:["yuzu","monk","straw-hat","leaf","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuzubou--keseras34938976",license:"MIT License",download:"assets/pets/upstream-20261009/yuzubou--keseras34938976.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yuzubou--keseras34938976",spritesheetSha256:"8e1bd8a6e5b0d5a644933bb8cc40615a8877e573d49fe436492d4c586c576fad",metadataNameAlias:!1,authorUrl:"https://github.com/Keseras34938976"},{id:"uesugi-erii--ricardo-2005",title:"\u4E0A\u6749\u7ED8\u68A8\u8863codex\u5BA0\u7269",englishTitle:"\u4E0A\u6749\u7ED8\u68A8\u8863codex\u5BA0\u7269",description:"\u4E0A\u6749\u7ED8\u68A8\u8863\u7684\u975E\u5B98\u65B9 AI \u540C\u4EBA Codex \u684C\u9762\u5BA0\u7269\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"Ricardo-2005",authorHandle:"Ricardo-2005",kind:"pet",atlas:"assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.webp",thumbnail:"assets/pets/upstream-20261009/uesugi-erii--ricardo-2005-thumb.webp",version:2,tags:["dragon-raja","uesugi-erii","anime","fan-art","red-hair","pixel-art","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/uesugi-erii--ricardo-2005",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u4F5C\u54C1\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",download:"assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/uesugi-erii--ricardo-2005",spritesheetSha256:"584ad142250b0bf601faa876618e38468de77dd5d7cc4e149e3cad1544f4b253",metadataNameAlias:!1,authorUrl:"https://github.com/Ricardo-2005"},{id:"yuanbao--legeling",title:"\u5143\u5B9D",englishTitle:"\u5143\u5B9D",description:"\u4E00\u53EA\u7070\u767D\u76F8\u95F4\u3001\u5E26\u82CF\u683C\u5170\u6298\u8033\u7279\u5F81\u548C\u5927\u5706\u773C\u7684\u534A\u5199\u5B9E\u864E\u6591\u732B\u684C\u9762\u4F19\u4F34\u3002",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/yuanbao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/yuanbao--legeling-thumb.webp",version:2,tags:["cat","scottish-fold","tabby","gray-white","community-request","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanbao--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/yuanbao--legeling.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yuanbao--legeling",spritesheetSha256:"dd37bd8664636ea6639ad4bf5e1ea50e82a5864b72520f88fb5fabc80222fa50",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"yae-miko--legeling",title:"\u516B\u91CD\u795E\u5B50",englishTitle:"Yae Miko",description:"\u300A\u539F\u795E\u300B\u516B\u91CD\u795E\u5B50\u7075\u611F\u7684\u539F\u521B\u975E\u5546\u4E1A Codex v2 chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7C89\u8272\u957F\u53D1\u3001\u72D0\u8033\u3001\u7EA2\u767D\u5DEB\u5973\u670D\u4E0E\u7D2B\u91D1\u914D\u9970\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/yae-miko--legeling.webp",thumbnail:"assets/pets/upstream-20261009/yae-miko--legeling-thumb.webp",version:2,tags:["genshin-impact","yae-miko","kitsune","shrine-maiden","pink-hair","pixel-art","chibi","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yae-miko--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/yae-miko--legeling.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yae-miko--legeling",spritesheetSha256:"5b211fae44ff5bd4541dcce1c01d378af30ed3c670b205b67d5a3c4c3323b884",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"liuboer--legeling",title:"\u5218\u6CE2\u513F",englishTitle:"\u5218\u6CE2\u513F",description:"A slim black Devon Rex with enormous triangular ears, yellow-green eyes and a short rippled coat.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/liuboer--legeling.webp",thumbnail:"assets/pets/upstream-20261009/liuboer--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liuboer--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/liuboer--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/liuboer--legeling",spritesheetSha256:"ac28440619bc4f318a386608ca6753a5a331b1d6f5cc8e36095f8b07c9f71614",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"miku-sea--legeling",title:"\u521D\u97F3\u672A\u6765\xB7\u6D77\u8272",englishTitle:"Hatsune Miku \xB7 Sea Colors",description:"\u5FE0\u5B9E\u4E8E\u8BF7\u6C42\u8005\u516D\u5E27\u6D77\u8272\u521D\u7A3F\u7684\u521D\u97F3\u672A\u6765\u590F\u88C5\u540C\u4EBA\u5BA0\u7269\uFF1A\u8349\u5E3D\u3001\u753B\u9762\u53F3\u4FA7\u767D\u8774\u8776\u7ED3\u3001\u767D\u84DD\u88D9\u88C5\u3001\u9752\u8272\u53CC\u9A6C\u5C3E\u548C\u8D64\u811A\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/miku-sea--legeling.webp",thumbnail:"assets/pets/upstream-20261009/miku-sea--legeling-thumb.webp",version:2,tags:["community-request","hatsune-miku","summer"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku-sea--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/miku-sea--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/miku-sea--legeling",spritesheetSha256:"2805e8f175d75231a0ea07a7fb9d4dc00203127b2dfa071810fc2f7aa7e68d77",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"gudong--rank",title:"\u5495\u549A",englishTitle:"\u5495\u549A",description:"A crown-wearing rabbit king with a leafy forelock, burgundy cape, and playful oversized eyes.",category:"\u539F\u521B\u89D2\u8272",author:"Rank",authorHandle:"Rank",kind:"pet",atlas:"assets/pets/upstream-20261009/gudong--rank.webp",thumbnail:"assets/pets/upstream-20261009/gudong--rank-thumb.webp",version:2,tags:["original-character","rabbit","king","crown","cape","cartoon","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gudong--rank",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/gudong--rank.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/gudong--rank",spritesheetSha256:"9a2cf19c6b2a24ac5e5950576d65ae957890938a416b5e177f0f93e48555c0f3",metadataNameAlias:!1},{id:"tuantuan--jbbom",title:"\u56E2\u56E2",englishTitle:"\u56E2\u56E2",description:"A soft, friendly orange-and-white shorthair kitten for Codex.",category:"\u52A8\u7269\u4F19\u4F34",author:"JbBom",authorHandle:"JbBom",kind:"pet",atlas:"assets/pets/upstream-20261009/tuantuan--jbbom.webp",thumbnail:"assets/pets/upstream-20261009/tuantuan--jbbom-thumb.webp",version:1,tags:["cat","kitten","orange-white","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tuantuan--jbbom",license:"MIT License",download:"assets/pets/upstream-20261009/tuantuan--jbbom.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tuantuan--jbbom",spritesheetSha256:"1b3b74e0688ad5db0b1e242eee4aa6facc746456f66cfe810877813b3ef65b62",metadataNameAlias:!1,authorUrl:"https://github.com/JbBom"},{id:"virtuosa--legeling",title:"\u5851\u5FC3\u963F\u5C14\u56FE\u7F57",englishTitle:"Virtuosa / Arturia",description:"\u6309\u793E\u533A\u53C2\u8003\u5236\u4F5C\u7684\u300A\u660E\u65E5\u65B9\u821F\u300B\u5851\u5FC3\u963F\u5C14\u56FE\u7F57\u540C\u4EBA\u5BA0\u7269\uFF0C\u4FDD\u7559\u9ED1\u53D1\u3001\u91D1\u773C\u3001\u9ED1\u91D1\u788E\u7247\u5149\u73AF\u548C\u7FFC\u72B6\u6784\u9020\u3002AI \u751F\u6210\uFF0C\u811A\u9774\u8865\u5168\u5DF2\u83B7\u5236\u4F5C\u5BA1\u6838\u8BA4\u53EF\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/virtuosa--legeling.webp",thumbnail:"assets/pets/upstream-20261009/virtuosa--legeling-thumb.webp",version:2,tags:["community-request","arknights","virtuosa"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/virtuosa--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/virtuosa--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/virtuosa--legeling",spritesheetSha256:"522496bafedb3c0fd368d82f1f8e933680c6c645799a40cc9790e03ad5024f90",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"dashu--legeling",title:"\u5927\u9F20",englishTitle:"\u5927\u9F20",description:"Da Shu from \u5927\u9F20\u4E0E\u7F8E\u53FD, with a broad gray face, pink ears, a cheerful toothy smile and a tiny body.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/dashu--legeling.webp",thumbnail:"assets/pets/upstream-20261009/dashu--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dashu--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/dashu--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/dashu--legeling",spritesheetSha256:"b922ad1ea917101bf5e39cd9c35dedd134d44164a12496736dbffa3332e10b84",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"dnf-female-ammo--qunboo",title:"dnf-female-ammo",englishTitle:"\u5973\u5F39\u836FQ",description:"A chibi-style Dungeon Fighter Online Female Mechanic (Ammo) desktop pet, featuring idle breathing and gun-twirl animations.",category:"\u6E38\u620F\u89D2\u8272",author:"QunBoo",authorHandle:"QunBoo",kind:"pet",atlas:"assets/pets/upstream-20261009/dnf-female-ammo--qunboo.webp",thumbnail:"assets/pets/upstream-20261009/dnf-female-ammo--qunboo-thumb.webp",version:1,tags:["dnf","dungeon-fighter","dungeon-fighter-online","female-ammo","game","chibi"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dnf-female-ammo--qunboo",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/dnf-female-ammo--qunboo.zip",date:"",importedAt:"2026-10-09",collections:["dungeon-fighter-online"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/dnf-female-ammo--qunboo",spritesheetSha256:"6c86347073986e57148f7b81980866c7ac2c68c1112b93a85519a142b208f59d",metadataNameAlias:!1,authorUrl:"https://github.com/QunBoo"},{id:"naiwa--sandytruant",title:"\u5976\u86D9",englishTitle:"\u5976\u86D9",description:"A yellow pear-shaped pixel companion that laughs when hovered.",category:"\u52A8\u7269\u4F19\u4F34",author:"Yitian Sun",authorHandle:"sandytruant",kind:"pet",atlas:"assets/pets/upstream-20261009/naiwa--sandytruant.webp",thumbnail:"assets/pets/upstream-20261009/naiwa--sandytruant-thumb.webp",version:2,tags:["frog","yellow","pixel-art","look-directions","codex-v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/naiwa--sandytruant",license:"MIT License",download:"assets/pets/upstream-20261009/naiwa--sandytruant.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/naiwa--sandytruant",spritesheetSha256:"5db71125ea2d30beb8507d7aae1e38521efa6db4f7cde6b1ced1a8b3a8d6439f",metadataNameAlias:!1,authorUrl:"https://github.com/sandytruant"},{id:"vyron--legeling",title:"\u5A01\u9F99",englishTitle:"Vyron",description:"An AI-generated, weapon-free community interpretation of Vyron from Delta Force, based on the Issue #234 reference. The specific game skin is unverified.",category:"\u5176\u4ED6",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/vyron--legeling.webp",thumbnail:"assets/pets/upstream-20261009/vyron--legeling-thumb.webp",version:2,tags:["community-request","ai-generated","fan-art","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/vyron--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/vyron--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/vyron--legeling",spritesheetSha256:"47d2430a4b59e3bac88ee9bb2a5912a14c8be077e7908db0244c34583683b8a7",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"xiaoda--legeling",title:"\u5C0F\u8FBE",englishTitle:"\u5C0F\u8FBE",description:"\u4E00\u53EA\u84DD\u767D\u914D\u8272\u3001\u5927\u773C\u3001\u53CC\u5929\u7EBF\u548C\u989D\u5934\u5C4F\u5E55\u7684\u8F6F\u8D28 3D Q \u7248\u673A\u5668\u4EBA\u4F19\u4F34\u3002",category:"\u673A\u5668\u4EBA",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/xiaoda--legeling.webp",thumbnail:"assets/pets/upstream-20261009/xiaoda--legeling-thumb.webp",version:2,tags:["xiaoda","community-request","ai-generated","robot","mascot","3d-toy","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiaoda--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u7D20\u6750\u76F8\u5173\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/xiaoda--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xiaoda--legeling",spritesheetSha256:"0e53ff190a3a51b22e956728a708f98575b1b9e5a871b463e08511162a89df26",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"little-black-cat--legeling",title:"\u5C0F\u9ED1\u732B",englishTitle:"\u5C0F\u9ED1\u732B",description:"A fuzzy brush-painted black cat with slanted golden eyes, a blue nose and an inquisitive gaze.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/little-black-cat--legeling.webp",thumbnail:"assets/pets/upstream-20261009/little-black-cat--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-black-cat--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/little-black-cat--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/little-black-cat--legeling",spritesheetSha256:"71cc9fa9b9f8d581370963e457e924af5e40e02a889b5ea191ba2566fa1d1309",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"iuno--legeling",title:"\u5C24\u8BFA",englishTitle:"Iuno",description:"\u5BF9\u5E94\u793E\u533A\u8BF7\u6C42 #176 \u4E0E #177 \u7684\u300A\u9E23\u6F6E\u300B\u5C24\u8BFA\u540C\u4EBA\u5BA0\u7269\uFF0C\u84DD\u8272\u53CC\u9A6C\u5C3E\u3001\u767D\u91D1\u670D\u88C5\u548C\u624B\u6301\u84DD\u91D1\u5706\u73AF\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/iuno--legeling.webp",thumbnail:"assets/pets/upstream-20261009/iuno--legeling-thumb.webp",version:2,tags:["community-request","wuthering-waves","iuno"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iuno--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/iuno--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/iuno--legeling",spritesheetSha256:"1ca0398437916007ee8f28b4b913e7bdea39eb1d5ac90a2fa5fe659682fac468",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"bubu-codebrew-bear--xxhh0822",title:"\u5E03\u5E03",englishTitle:"\u5E03\u5E03",description:"A focused cocoa-brown bear coding at a cyan laptop with a small white coffee mug.",category:"\u5409\u7965\u7269",author:"xxhh0822",authorHandle:"xxhh0822",kind:"pet",atlas:"assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.webp",thumbnail:"assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822-thumb.webp",version:2,tags:["bear","coding","laptop","coffee","chibi","original","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu-codebrew-bear--xxhh0822",license:"CC BY-NC 4.0. Original AI-assisted artwork submitted by xxhh0822 for non-commercial use; no third-party source pixels were copied.",download:"assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/bubu-codebrew-bear--xxhh0822",spritesheetSha256:"20c82a9e88e9561ab3a6f632d8eed1cca5df755fcb500ccdf9a4b576e69e1334",metadataNameAlias:!1,authorUrl:"https://github.com/xxhh0822"},{id:"koukou-penguin--hoody",title:"\u6263\u6263\u4F01\u9E45",englishTitle:"\u6263\u6263\u4F01\u9E45",description:"\u4E00\u53EA\u6234\u7740\u7EA2\u56F4\u5DFE\u3001\u4F1A\u7728\u773C\u7684\u5706\u6EDA\u6EDA\u9ED1\u767D\u4F01\u9E45\u4F19\u4F34\u3002",category:"\u52A8\u7269\u4F19\u4F34",author:"hoody",authorHandle:"hoody",kind:"pet",atlas:"assets/pets/upstream-20261009/koukou-penguin--hoody.webp",thumbnail:"assets/pets/upstream-20261009/koukou-penguin--hoody-thumb.webp",version:2,tags:["penguin","animal","red-scarf","3d-toy","original"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/koukou-penguin--hoody",license:"CC BY-NC 4.0. Original asset created by hoody; no third-party source asset.",download:"assets/pets/upstream-20261009/koukou-penguin--hoody.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/koukou-penguin--hoody",spritesheetSha256:"53f3a730f8485d351976b51c7b918953381a92be95387df17d481069f5defa5c",metadataNameAlias:!1},{id:"xuxu-baobao--legeling",title:"\u65ED\u65ED\u5B9D\u5B9D",englishTitle:"\u65ED\u65ED\u5B9D\u5B9D",description:"An AI-generated miniature avatar based on the reference supplied with request #115, with nine animation states and sixteen look directions. The accepted scope is the V2 sprite package; custom desktop interaction and voice features are outside this delivery.",category:"\u4EBA\u7269\u5934\u50CF",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/xuxu-baobao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/xuxu-baobao--legeling-thumb.webp",version:2,tags:["human-avatar","ai-generated","codex-v2","community-request"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xuxu-baobao--legeling",license:"CC BY-NC 4.0 for this AI-generated sprite asset; non-commercial use only. Commercial use is prohibited. Rights in the depicted person's identity and supplied reference photograph remain with their respective rights holders.",download:"assets/pets/upstream-20261009/xuxu-baobao--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xuxu-baobao--legeling",spritesheetSha256:"fee42cb0b3a51735520ba506534b9c78583eea7ac2948fd48332c220806ee9a0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"hance-woniu--korn",title:"\u65F1\u5395\u8717\u725B",englishTitle:"\u65F1\u5395\u8717\u725B",description:"\u4E00\u4E2A\u61A8\u61A8\u5FAE\u7B11\u3001\u5634\u89D2\u6302\u7740\u84DD\u8272\u53E3\u6C34\u7684\u767D\u8272\u5706\u5934\u7F51\u7EDC\u6897\u5BA0\u7269\u3002",category:"\u7F51\u7EDC\u6897\u56FE",author:"korn",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/hance-woniu--korn.webp",thumbnail:"assets/pets/upstream-20261009/hance-woniu--korn-thumb.webp",version:2,tags:["meme","douyin","white-mascot","drool","hand-drawn","codex-v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hance-woniu--korn",license:"CC BY-NC 4.0 (korn's original three-view artwork and this Codex pet adaptation only; no claim over third-party meme materials)",download:"assets/pets/upstream-20261009/hance-woniu--korn.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hance-woniu--korn",spritesheetSha256:"8ba2e9a2964c88f93b533e35fc69148da6d314e74711c86fd4231e09a4305255",metadataNameAlias:!1},{id:"liubao--killyer",title:"\u69B4\u5B9D",englishTitle:"\u69B4\u5B9D",description:"\u4E00\u53EA\u5706\u6EDA\u6EDA\u3001\u67D4\u8F6F\u4EB2\u5207\u7684\u69B4\u83B2\u6BDB\u7ED2\u684C\u9762\u5BA0\u7269\u3002",category:"\u539F\u521B\u89D2\u8272",author:"Shawnzhou",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/liubao--killyer.webp",thumbnail:"assets/pets/upstream-20261009/liubao--killyer-thumb.webp",version:2,tags:["original","durian","plush","cute"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liubao--killyer",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/liubao--killyer.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/liubao--killyer",spritesheetSha256:"65954ab3eeb02772ebac5f4fb05279fa5d2f88bd93c4132eea54d3a3b50d9b4b",metadataNameAlias:!1},{id:"shen-xinghui--legeling",title:"\u6C88\u661F\u56DE",englishTitle:"\u6C88\u661F\u56DE",description:"\u4E00\u4F4D\u94F6\u7070\u53D1\u3001\u84DD\u7D2B\u773C\u3001\u8EAB\u7740\u6D45\u8272\u672A\u6765\u5236\u670D\u7684\u6E29\u67D4 Q \u7248\u4F19\u4F34\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/shen-xinghui--legeling.webp",thumbnail:"assets/pets/upstream-20261009/shen-xinghui--legeling-thumb.webp",version:2,tags:["love-and-deepspace","shen-xinghui","community-request","ai-generated","fan-art","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shen-xinghui--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u300A\u604B\u4E0E\u6DF1\u7A7A\u300B\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",download:"assets/pets/upstream-20261009/shen-xinghui--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/shen-xinghui--legeling",spritesheetSha256:"d9fd7cfd22d33fb00a7ee6f5f1d29baa68919cb14ac1bda55ea1d8426c6e7ef3",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"otama--legeling",title:"\u6D77\u8D3C\u738B\u5C0F\u7389",englishTitle:"\u6D77\u8D3C\u738B\u5C0F\u7389",description:"\u300A\u6D77\u8D3C\u738B\u300B\u5C0F\u7389\uFF0C\u4FDD\u7559\u7D2B\u53D1\u82B1\u9970\u3001\u7EFF\u8272\u8865\u4E01\u548C\u670D\u3001\u9EC4\u8272\u8170\u5E26\u4E0E\u8349\u5C65\u7684 V2 \u52A8\u753B\u5BA0\u7269\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/otama--legeling.webp",thumbnail:"assets/pets/upstream-20261009/otama--legeling-thumb.webp",version:2,tags:["community-request","one-piece","otama"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/otama--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/otama--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/otama--legeling",spritesheetSha256:"df03b7e1628e5693dfeb324302b1920fe81eec427465488338f13aca5a3e35f3",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"neptune--legeling",title:"\u6D85\u666E\u7F07\u52AA",englishTitle:"Neptune",description:"\u6309\u793E\u533A\u8BF7\u6C42\u5236\u4F5C\u7684\u6D85\u666E\u7F07\u52AA\u666E\u901A\u5F62\u6001\u50CF\u7D20\u98CE\u540C\u4EBA\u5BA0\u7269\uFF0C\u767D\u7D2B\u8FDE\u5E3D\u5916\u5957\u3001\u65B9\u5411\u952E\u53D1\u5939\u548C\u7D2B\u8272\u978B\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/neptune--legeling.webp",thumbnail:"assets/pets/upstream-20261009/neptune--legeling-thumb.webp",version:2,tags:["community-request","neptunia","pixel-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/neptune--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/neptune--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/neptune--legeling",spritesheetSha256:"3a53c81e95231edb55c20393f417a9d8bfa3f278a7e22d05d9a185ad3432d28e",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"niulai--legeling",title:"\u725B\u6765",englishTitle:"\u725B\u6765",description:"\u4E00\u53EA\u6A59\u68D5\u8272\u3001\u77ED\u7070\u89D2\u3001\u5706\u773C\u548C\u6D45\u7C89\u53E3\u9F3B\u7684\u61A8\u840C Q \u7248\u725B\u4F19\u4F34\u3002",category:"\u7F51\u7EDC\u6897\u56FE",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/niulai--legeling.webp",thumbnail:"assets/pets/upstream-20261009/niulai--legeling-thumb.webp",version:2,tags:["niulai","community-request","ai-generated","meme","3d-toy","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niulai--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u7D20\u6750\u76F8\u5173\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/niulai--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/niulai--legeling",spritesheetSha256:"dd95068c122aecebbb4056918eba49513e4969cb00b503b9494319f2b410e399",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"gift--legeling",title:"\u793C\u7269",englishTitle:"Gift",description:"A round tabby-white cat with green-yellow eyes, white paws and a thick ringed tail.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/gift--legeling.webp",thumbnail:"assets/pets/upstream-20261009/gift--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gift--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/gift--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/gift--legeling",spritesheetSha256:"978c742dcdc54d5260ba61a8337491acfe8f5969caa26f0b232d9e9ba5301617",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"luo-xiaohei--legeling",title:"\u7F57\u5C0F\u9ED1",englishTitle:"\u7F57\u5C0F\u9ED1",description:"\u4E00\u4F4D\u9ED1\u53D1\u3001\u7EFF\u773C\u3001\u6DE1\u7EFF\u89D2\u9970\u3001\u84DD\u8272\u4E0A\u8863\u4E0E\u5C0F\u9ED1\u5C3E\u5DF4\u7684 Q \u7248\u68EE\u6797\u4F19\u4F34\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/luo-xiaohei--legeling.webp",thumbnail:"assets/pets/upstream-20261009/luo-xiaohei--legeling-thumb.webp",version:2,tags:["luo-xiaohei","community-request","ai-generated","anime","forest-child","sticker","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/luo-xiaohei--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u76F8\u5173\u89D2\u8272\u6216\u5546\u6807\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/luo-xiaohei--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/luo-xiaohei--legeling",spritesheetSha256:"52c8feff0a688e6b18791e452d5eff090823fcaf8306f8f1f8da64e30e15c468",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"xiang-an--legeling",title:"\u7FD4\u5B89",englishTitle:"\u7FD4\u5B89",description:"\u4E00\u5BF9\u5F69\u8272\u5916\u5957\u4E0E\u8584\u8377\u7EFF\u8FDE\u4F53\u8863\u7684 Q \u7248\u5144\u5F1F\u642D\u6863\u3002",category:"\u4EBA\u7269\u5934\u50CF",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/xiang-an--legeling.webp",thumbnail:"assets/pets/upstream-20261009/xiang-an--legeling-thumb.webp",version:2,tags:["community-request","ai-generated","sibling-duo","chibi","sticker","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiang-an--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002",download:"assets/pets/upstream-20261009/xiang-an--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xiang-an--legeling",spritesheetSha256:"1e9a5dd74676341e18ec23752c877c94f293a3bb7ab91ff5a8ad7166bb2cd4ad",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"maodie--octane0411",title:"\u8004\u800B",englishTitle:"\u8004\u800B",description:"\u4E00\u53EA\u5706\u5934\u98DE\u673A\u8033\u3001\u7C89\u9F3B\u772F\u773C\uFF0C\u51F6\u840C\u53C8\u5014\u5F3A\u7684\u6A58\u767D\u732B\u3002",category:"\u7F51\u7EDC\u6897\u56FE",author:"Octane0411",authorHandle:"Octane0411",kind:"pet",atlas:"assets/pets/upstream-20261009/maodie--octane0411.webp",thumbnail:"assets/pets/upstream-20261009/maodie--octane0411-thumb.webp",version:2,tags:["cat","orange-cat","meme","maodie","codex-v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/maodie--octane0411",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/maodie--octane0411.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/maodie--octane0411",spritesheetSha256:"eb819e188df3efc8dc7c0ac11d6533fb01cfe869a56a80835fd44fc6882517d5",metadataNameAlias:!1,authorUrl:"https://github.com/Octane0411"},{id:"nijika--amia",title:"\u8679\u590F",englishTitle:"Nijika Ijichi",description:"\u4F0A\u5730\u77E5\u8679\u590F\u3002\u4E0B\u5317\u6CFD\u5927\u5929\u4F7F\uFF01\u793E\u533A\u4F5C\u8005\uFF1AAmia\u306D",category:"\u52A8\u6F2B\u89D2\u8272",author:"Amia\u306D",authorHandle:"amiaverse",kind:"pet",atlas:"assets/pets/upstream-20261009/nijika--amia.webp",thumbnail:"assets/pets/upstream-20261009/nijika--amia-thumb.webp",version:2,tags:["anime","music","drummer","bocchi-the-rock","fan-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nijika--amia",license:"Non-commercial use and redistribution with attribution to Amia\u306D; original character and design rights remain with their respective owners.",download:"assets/pets/upstream-20261009/nijika--amia.zip",date:"",importedAt:"2026-10-09",collections:["bocchi-the-rock"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/nijika--amia",spritesheetSha256:"85e14504b95e92ea77c362174bb1979a8a067f55a67b1915f33721eaa66451f9",metadataNameAlias:!1,authorUrl:"https://github.com/amiaverse"},{id:"hongmao--legeling",title:"\u8679\u732B\u5C11\u4FA0",englishTitle:"\u8679\u732B\u5C11\u4FA0",description:"A young orange cat swordsman in white martial clothing, a yellow scarf and an orange cape, holding his orange-red sword.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/hongmao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/hongmao--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hongmao--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/hongmao--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hongmao--legeling",spritesheetSha256:"4022eb2d77c1641c95d548e033aa496a45376f3facc932accf206e62492ac4aa",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"jinmao--legeling",title:"\u91D1\u6BDB",englishTitle:"\u91D1\u6BDB",description:"\u4E00\u53EA\u53FC\u7740\u7F51\u7403\u3001\u5782\u7740\u5927\u8033\u6735\u7684\u5976\u6CB9\u6D45\u91D1\u8272\u6CBB\u6108\u7CFB\u91D1\u6BDB\u5E7C\u72AC\u3002",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/jinmao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/jinmao--legeling-thumb.webp",version:2,tags:["golden-retriever","dog","puppy","tennis-ball","community-request","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/jinmao--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/jinmao--legeling.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/jinmao--legeling",spritesheetSha256:"1845ef8174a902f72fe269af9e22efff5c2cab9e0bb9aa330a0acb40569a74f6",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"arona--legeling",title:"\u963F\u7F57\u90A3",englishTitle:"\u963F\u7F57\u90A3",description:"\u4E00\u4F4D\u6D45\u84DD\u77ED\u53D1\u3001\u9752\u8272\u5149\u73AF\u4E0E\u6C34\u624B\u670D\u7684 Q \u7248\u6821\u56ED\u4F19\u4F34\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/arona--legeling.webp",thumbnail:"assets/pets/upstream-20261009/arona--legeling-thumb.webp",version:2,tags:["blue-archive","arona","community-request","ai-generated","fan-art","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arona--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u300A\u78A7\u84DD\u6863\u6848\u300B\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",download:"assets/pets/upstream-20261009/arona--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/arona--legeling",spritesheetSha256:"4140848d8c5cc7831f78d200101910ba831a63a8ad9de6f085b15bcf14bec1d0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"zayne--legeling",title:"\u9ECE\u6DF1",englishTitle:"Zayne",description:"\u6309\u793E\u533A\u793C\u670D\u53C2\u8003\u5236\u4F5C\u7684\u300A\u604B\u4E0E\u6DF1\u7A7A\u300B\u9ECE\u6DF1 3D Q\u7248\u540C\u4EBA\u5BA0\u7269\uFF0C\u4FDD\u7559\u7EFF\u773C\u3001\u96EA\u82B1\u80F8\u9488\u4E0E\u7EC6\u94FE\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/zayne--legeling.webp",thumbnail:"assets/pets/upstream-20261009/zayne--legeling-thumb.webp",version:2,tags:["community-request","love-and-deepspace","chibi-3d"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/zayne--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/zayne--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/zayne--legeling",spritesheetSha256:"e6f9f91eb5a32f240766b96447f4a847f4fdf2b772a9c6a6ac989b6e9ef788aa",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"bocchi--lingxiaotian",title:"\u540E\u85E4\u72EC",englishTitle:"Bocchi",description:"A compact Codex digital pet inspired by Bocchi from Bocchi the Rock.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/bocchi--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/bocchi--lingxiaotian-thumb.webp",version:1,tags:["anime","music","guitar","bocchi-the-rock","pink-hair"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bocchi--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/bocchi--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["bocchi-the-rock"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/bocchi--lingxiaotian",spritesheetSha256:"d8514dac88d4811c9f238530602f22721f5e2368d5b05238ff906251d457eb72",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"}],Zt=[{id:"lingyin.file-assistant",title:"\u6587\u4EF6\u52A9\u624B",kind:"plugin",pluginType:"host-tool",description:"\u5FEB\u901F\u5B9A\u4F4D\u6587\u4EF6\u3001\u6253\u5F00\u76EE\u5F55\u3001\u865A\u62DF\u5206\u7C7B\u5E93\u4E0E\u53EF\u64A4\u9500\u63A8\u8350\u6574\u7406\uFF1B\u53EF\u4F7F\u7528\u4F60\u914D\u7F6E\u7684 AI \u5BA1\u6838\u5206\u7C7B\u3002",category:"\u53EF\u9009\u5DE5\u5177",author:Ee,symbol:"\u6587",version:"1.0.0",sourceFolder:"lingyin-file-assistant",source:"\u672C\u9879\u76EE plugins/community/lingyin-file-assistant",license:"MIT\uFF08\u63D2\u4EF6\u6E05\u5355\u4E0E\u5165\u53E3\u4EE3\u7801\uFF09",download:"assets/lingyin.file-assistant.zip",permissions:["files","status"],permissionLabels:["\u672C\u673A\u6587\u4EF6\u529F\u80FD","\u63D2\u4EF6\u72B6\u6001"],features:["\u8BE2\u95EE\u6587\u4EF6\u4F4D\u7F6E\u5E76\u6253\u5F00\u5BF9\u5E94\u6587\u4EF6\u5939","\u865A\u62DF\u5206\u7C7B\u5E93\u4FDD\u7559\u539F\u4EF6\u4F4D\u7F6E","\u6309\u63A8\u8350\u6574\u7406\u9700\u4E3B\u52A8\u9009\u62E9\uFF0C\u53EF\u6309\u8BB0\u5F55\u64A4\u9500","\u4F7F\u7528\u672C\u5730\u5DF2\u914D\u7F6E\u7684 AI \u5BA1\u6838\u5206\u7C7B"],hostNotice:"\u8FD9\u662F desktop pet \u5BBF\u4E3B\u5DE5\u5177\u63D2\u4EF6\u3002\u5B89\u88C5\u3001\u786E\u8BA4\u6743\u9650\u5E76\u542F\u7528\u540E\uFF0C\u4ECE\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u6574\u7406\u6216\u5220\u9664\u6587\u4EF6\u3002"},{id:"lingyin.computer-care",title:"\u7535\u8111\u5B88\u62A4",kind:"plugin",pluginType:"host-tool",description:"\u5185\u5B58\u3001\u78C1\u76D8\u4E0E\u81EA\u542F\u8BCA\u65AD\u5EFA\u8BAE\uFF0C\u4E0B\u8F7D\u98CE\u9669\u63D0\u9192\u3001\u5B89\u88C5\u5305\u53EA\u8BFB\u68C0\u67E5\u53CA\u5378\u8F7D\u76EE\u5F55\u6838\u5BF9\u3002",category:"\u53EF\u9009\u5DE5\u5177",author:Ee,symbol:"\u62A4",version:"1.0.0",sourceFolder:"lingyin-computer-care",source:"\u672C\u9879\u76EE plugins/community/lingyin-computer-care",license:"MIT\uFF08\u63D2\u4EF6\u6E05\u5355\u4E0E\u5165\u53E3\u4EE3\u7801\uFF09",download:"assets/lingyin.computer-care.zip",permissions:["files","system:metrics","status"],permissionLabels:["\u7528\u6237\u9009\u62E9\u7684\u6587\u4EF6\u4E0E\u76EE\u5F55","\u7535\u8111\u8D44\u6E90\u8BFB\u53D6","\u63D2\u4EF6\u72B6\u6001"],features:["\u5185\u5B58\u3001\u78C1\u76D8\u4E0E\u81EA\u542F\u8BCA\u65AD\u53CA\u4FDD\u5B58\u8DEF\u5F84\u7B49\u5EFA\u8BAE","\u7528\u6237\u5F00\u542F\u540E\u63D0\u9192\u53EF\u80FD\u6709\u6346\u7ED1\u98CE\u9669\u7684\u4E0B\u8F7D\u884C\u4E3A","\u9009\u62E9 EXE/MSI \u5B89\u88C5\u5305\u540E\u53EA\u8BFB\u68C0\u67E5\uFF0C\u4E0D\u6267\u884C\u5B89\u88C5","\u6838\u5BF9\u9009\u62E9\u7684\u5378\u8F7D\u76EE\u5F55\uFF0C\u4E0D\u81EA\u52A8\u5378\u8F7D\u6216\u5220\u9664"],hostNotice:"\u8FD9\u662F desktop pet \u5BBF\u4E3B\u5DE5\u5177\u63D2\u4EF6\u3002\u5B89\u88C5\u3001\u786E\u8BA4\u6743\u9650\u5E76\u542F\u7528\u540E\uFF0C\u4ECE\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\uFF1B\u4E0B\u8F7D\u76D1\u6D4B\u7531\u4F60\u5F00\u542F\uFF0C\u98CE\u9669\u63D0\u793A\u4E0D\u4EE3\u8868\u5B89\u88C5\u5305\u5B89\u5168\u4FDD\u8BC1\u3002"}],Vt=[{id:"openpets.reminders",title:"\u5FEB\u901F\u63D0\u9192",description:"\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8BBE\u7F6E\u7B80\u77ED\u7684\u672C\u5730\u63D0\u9192\uFF0C\u5230\u70B9\u65F6\u4F1A\u901A\u8FC7\u58F0\u97F3\u3001\u89D2\u6807\u548C\u53EF\u7A0D\u540E\u63D0\u9192\u7684\u60AC\u6D6E\u6C14\u6CE1\u901A\u77E5\u4F60\u3002",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u63D0",version:"1.2.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.reminders",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.reminders.zip",permissions:["pet:speak","pet:interact","audio","schedule","storage","commands","status","notify"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u7CFB\u7EDF\u63D0\u9192"],features:["\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8BBE\u7F6E\u7B80\u77ED\u7684\u672C\u5730\u63D0\u9192\uFF0C\u5230\u70B9\u65F6\u4F1A\u901A\u8FC7\u58F0\u97F3\u3001\u89D2\u6807\u548C\u53EF\u7A0D\u540E\u63D0\u9192\u7684\u60AC\u6D6E\u6C14\u6CE1\u901A\u77E5\u4F60\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.reminders",sha256:"69f891c89e23c1f7f639a2326b1ff4de18bba19977985a487a3b940b942868cc",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.simple-timer",title:"\u8F7B\u91CF\u8BA1\u65F6\u5668",description:"A one-shot countdown timer with a pet HUD, pause controls, and an expiry alert.",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u65F6",version:"1.1.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.simple-timer",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.simple-timer.zip",permissions:["pet:speak","pet:interact","pet:pin","audio","schedule","storage","commands","status","notify"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u56FA\u5B9A\u6C14\u6CE1","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u7CFB\u7EDF\u63D0\u9192"],features:["A one-shot countdown timer with a pet HUD, pause controls, and an expiry alert.","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.simple-timer",sha256:"a82367cd2e7c15e24171cda2d25e916e0b7cc75675db01cd319d995a7d21d861",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.anxiety-aid-tools",title:"Anxiety Aid Tools",description:"\u56F4\u7ED5\u5BA0\u7269\u8FDB\u884C\u7684\u5E73\u9759\u7EC3\u4E60\uFF1A\u547C\u5438\u3001\u808C\u8089\u653E\u677E\u3001\u7740\u9646\u7EC3\u4E60\u3001\u5F15\u5BFC\u51A5\u60F3\u3001\u610F\u8C61\u653E\u677E\u4E0E\u8212\u7F13\u58F0\u97F3\u3002https://anxietyaidtools.com/ \u7684 desktop pet \u4F34\u4FA3\u3002",kind:"plugin",pluginType:"sdk",category:"\u8EAB\u5FC3\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5FC3",version:"0.1.1",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.anxiety-aid-tools",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.anxiety-aid-tools.zip",permissions:["ui:session","commands","storage","network"],permissionLabels:["\u7EC3\u4E60\u9762\u677F","\u4E3B\u52A8\u547D\u4EE4","\u63D2\u4EF6\u5B58\u6863","\u7F51\u7EDC\u8BBF\u95EE"],features:["\u56F4\u7ED5\u5BA0\u7269\u8FDB\u884C\u7684\u5E73\u9759\u7EC3\u4E60\uFF1A\u547C\u5438\u3001\u808C\u8089\u653E\u677E\u3001\u7740\u9646\u7EC3\u4E60\u3001\u5F15\u5BFC\u51A5\u60F3\u3001\u610F\u8C61\u653E\u677E\u4E0E\u8212\u7F13\u58F0\u97F3\u3002https://anxietyaidtools.com/ \u7684 desktop pet \u4F34\u4FA3\u3002"],sourceFolder:"plugins/official/openpets.anxiety-aid-tools",sha256:"b9b337f47d13b91b607aa5f8b1720540d18090c277a024c18fec90e7bc795c5d",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.focus-buddy",title:"\u4E13\u6CE8\u4F19\u4F34",description:"\u4E00\u4E2A\u5BA0\u7269\u756A\u8304\u949F\u5F0F\u4E13\u6CE8\u8BA1\u65F6\u5668\uFF0C\u5E2E\u4F60\u4E13\u6CE8\uFF0C\u5E76\u63D0\u9192\u4F60\u4F11\u606F\u3002",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u4E13",version:"1.2.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.focus-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.focus-buddy.zip",permissions:["pet:speak","pet:interact","pet:pin","schedule","storage","commands","status","audio"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u56FA\u5B9A\u6C14\u6CE1","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u58F0\u97F3"],features:["\u4E00\u4E2A\u5BA0\u7269\u756A\u8304\u949F\u5F0F\u4E13\u6CE8\u8BA1\u65F6\u5668\uFF0C\u5E2E\u4F60\u4E13\u6CE8\uFF0C\u5E76\u63D0\u9192\u4F60\u4F11\u606F\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.focus-buddy",sha256:"045b99a3bb461de04995a594b569c4bffba201a2ed937e1397fd6af2353d5c37",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.launch-buddy",title:"\u542F\u52A8\u95EE\u5019",description:"\u53CB\u597D\u7684\u542F\u52A8\u95EE\u5019\uFF0C\u5E26\u6709\u6E29\u548C\u7684\u65F6\u673A\u3001\u53CD\u5E94\u548C\u53EF\u9009\u7684\u58F0\u97F3\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5019",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.launch-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.launch-buddy.zip",permissions:["pet:speak","pet:reaction","audio","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u53CB\u597D\u7684\u542F\u52A8\u95EE\u5019\uFF0C\u5E26\u6709\u6E29\u548C\u7684\u65F6\u673A\u3001\u53CD\u5E94\u548C\u53EF\u9009\u7684\u58F0\u97F3\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.launch-buddy",sha256:"26529303d502ec5fa8f14672a91dd80559a022fd81988929341bf1a7453ae60b",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.fortune-cookie",title:"\u6BCF\u65E5\u5E78\u8FD0\u997C\u5E72",description:"\u4E00\u5757\u5C0F\u5C0F\u5E78\u8FD0\u997C\u5E72\u9001\u6765\u7684\u6E29\u67D4\u6BCF\u65E5\u4FBF\u7B7E\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u7B7E",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.fortune-cookie",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.fortune-cookie.zip",permissions:["pet:speak","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u4E00\u5757\u5C0F\u5C0F\u5E78\u8FD0\u997C\u5E72\u9001\u6765\u7684\u6E29\u67D4\u6BCF\u65E5\u4FBF\u7B7E\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.fortune-cookie",sha256:"31785f20974e7921b0def5b88bbcd7a4aa34926cf09b35ec2d9b21297c22bb9f",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.virtual-pet",title:"\u865A\u62DF\u5BA0\u7269",description:"\u7167\u987E\u4E00\u4E2A\u5C0F\u5C0F\u7684\u684C\u9762\u4F19\u4F34\uFF0C\u901A\u8FC7\u6E29\u67D4\u7684\u65E5\u5E38\u4E92\u52A8\u770B\u7740\u4F60\u4EEC\u7684\u7F81\u7ECA\u6210\u957F\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5BA0",version:"1.2.2",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.virtual-pet",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.virtual-pet.zip",permissions:["pet:speak","pet:interact","pet:pin","pet:reaction","schedule","storage","commands","audio","events","bus"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u56FA\u5B9A\u6C14\u6CE1","\u52A8\u4F5C\u53CD\u5E94","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u58F0\u97F3","\u4EA4\u4E92\u4E8B\u4EF6","\u63D2\u4EF6\u534F\u540C"],features:["\u7167\u987E\u4E00\u4E2A\u5C0F\u5C0F\u7684\u684C\u9762\u4F19\u4F34\uFF0C\u901A\u8FC7\u6E29\u67D4\u7684\u65E5\u5E38\u4E92\u52A8\u770B\u7740\u4F60\u4EEC\u7684\u7F81\u7ECA\u6210\u957F\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.virtual-pet",sha256:"36e88d3ab8e4e2aefaf082e424aff83c3c734845a933de7af83c67e4069b8f30",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.life-companion",title:"\u751F\u6D3B\u4F19\u4F34",description:"\u6309\u9700\u5065\u5EB7\u63D0\u9192\u3001\u4E3B\u52A8\u7167\u987E\u548C\u62D6\u62FD\u53CD\u9988\u3002\u968F\u673A\u52A8\u4F5C\u4E0E\u5B89\u9759\u6A21\u5F0F\u5728\u6211\u7684\u684C\u5BA0\u4E2D\u7EDF\u4E00\u914D\u7F6E\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"Lykinzlj",symbol:"\u4F34",version:"1.1.0",source:"\u672C\u9879\u76EE plugins/official/openpets.life-companion",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.life-companion.zip",permissions:["pet:speak","pet:interact","pets:read","schedule","storage","commands","events","bus"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u684C\u5BA0\u72B6\u6001","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u4EA4\u4E92\u4E8B\u4EF6","\u63D2\u4EF6\u534F\u540C"],features:["\u6309\u9700\u5065\u5EB7\u63D0\u9192\u3001\u4E3B\u52A8\u7167\u987E\u548C\u62D6\u62FD\u53CD\u9988\u3002\u968F\u673A\u52A8\u4F5C\u4E0E\u5B89\u9759\u6A21\u5F0F\u5728\u6211\u7684\u684C\u5BA0\u4E2D\u7EDF\u4E00\u914D\u7F6E\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.life-companion",sha256:"630709bdc3ed8f816bf9e963d0cd6b2c4e8f0f6fdc6bcc227999cbf19b7f71ec",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.water-reminder",title:"\u559D\u6C34\u63D0\u9192",description:"\u8BA9\u5BA0\u7269\u6E29\u67D4\u63D0\u9192\u4F60\u559D\u70B9\u6C34\u3002",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6C34",version:"1.0.1",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.water-reminder",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.water-reminder.zip",permissions:["pet:speak","pet:interact","audio","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u8BA9\u5BA0\u7269\u6E29\u67D4\u63D0\u9192\u4F60\u559D\u70B9\u6C34\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.water-reminder",sha256:"36da575e91abaa1acb9a3421b6b3712d249ed6e98b15d8c9001ff1f5fc3ba6df",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.system-resources",title:"\u7CFB\u7EDF\u8D44\u6E90",description:"\u5728\u5BA0\u7269\u4E0A\u663E\u793A\u5B9E\u65F6 CPU \u548C\u5185\u5B58\u4EEA\u8868\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 GPU \u548C\u78C1\u76D8\u6307\u6807\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"Karim Bouwmans",symbol:"\u4EEA",version:"2.2.0",source:"https://github.com/OpenPetsHQ/Openpets-system-resources",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.system-resources.zip",permissions:["pet:speak","pet:reaction","pet:pin","schedule","storage","commands","status","events","system:metrics"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u56FA\u5B9A\u6C14\u6CE1","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u4EA4\u4E92\u4E8B\u4EF6","\u53EA\u8BFB\u8D44\u6E90\u6307\u6807"],features:["\u5728\u5BA0\u7269\u4E0A\u663E\u793A\u5B9E\u65F6 CPU \u548C\u5185\u5B58\u4EEA\u8868\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 GPU \u548C\u78C1\u76D8\u6307\u6807\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.system-resources",sha256:"89adb44a21f900d1ffb72baac8b5ec7deb56b4a19f8219f1c8044941de3ae108",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.calendar-airmail",title:"\u65E5\u5386\u822A\u7A7A\u90AE\u4EF6",description:"\u901A\u8FC7\u6240\u9009\u4FE1\u4F7F\u4EE5\u822A\u7A7A\u90AE\u4EF6\u65B9\u5F0F\u53D1\u9001 Google \u65E5\u5386\u6D3B\u52A8\u63D0\u9192\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5386",version:"1.2.3",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.calendar-airmail",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.calendar-airmail.zip",permissions:["ui:delivery","auth","network","schedule","storage","commands","status"],permissionLabels:["\u4FE1\u4F7F\u63D0\u9192","\u5916\u90E8\u670D\u52A1\u6388\u6743","\u7F51\u7EDC\u8BBF\u95EE","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001"],features:["\u901A\u8FC7\u6240\u9009\u4FE1\u4F7F\u4EE5\u822A\u7A7A\u90AE\u4EF6\u65B9\u5F0F\u53D1\u9001 Google \u65E5\u5386\u6D3B\u52A8\u63D0\u9192\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.calendar-airmail",sha256:"654b36a22a184833394cdd5eb23e6768bbd422a5556c8c13acb898bbb22420d1",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.day-routine",title:"\u65E9\u665A\u65E5\u5E38",description:"\u6E29\u548C\u7684\u6BCF\u65E5\u966A\u4F34\uFF0C\u548C\u4F60\u7684\u5BA0\u7269\u4E00\u8D77\u5F00\u59CB\u5E76\u6536\u8D77\u4E00\u5929\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6668",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.day-routine",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.day-routine.zip",permissions:["pet:speak","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u6E29\u548C\u7684\u6BCF\u65E5\u966A\u4F34\uFF0C\u548C\u4F60\u7684\u5BA0\u7269\u4E00\u8D77\u5F00\u59CB\u5E76\u6536\u8D77\u4E00\u5929\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.day-routine",sha256:"dba10f72653453d96c6c5f9a54d436a1b14345453211fd17c6c05169db60767d",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.magic-8-ball",title:"\u9B54\u6CD5 8 \u53F7\u7403",description:"\u95EE\u4E00\u4E2A\u8F7B\u677E\u7684\u95EE\u9898\uFF0C\u8BA9\u5BA0\u7269\u7ED9\u4F60\u6E29\u6696\u53C8\u4FCF\u76AE\u7684\u56DE\u7B54\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u7403",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.magic-8-ball",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.magic-8-ball.zip",permissions:["pet:speak","commands","storage"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E3B\u52A8\u547D\u4EE4","\u63D2\u4EF6\u5B58\u6863"],features:["\u95EE\u4E00\u4E2A\u8F7B\u677E\u7684\u95EE\u9898\uFF0C\u8BA9\u5BA0\u7269\u7ED9\u4F60\u6E29\u6696\u53C8\u4FCF\u76AE\u7684\u56DE\u7B54\u3002"],sourceFolder:"plugins/official/openpets.magic-8-ball",sha256:"d18c6c50bdaf6490a94ba95db130a0352c5775b44187170944624ba48549f260",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.mood-check-in",title:"\u5FC3\u60C5\u7B7E\u5230",description:"\u6BCF\u5929\u4E00\u6B21\u6E29\u548C\u5730\u7559\u610F\u4F60\u5F53\u4E0B\u7684\u611F\u53D7\u3002",kind:"plugin",pluginType:"sdk",category:"\u8EAB\u5FC3\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6674",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.mood-check-in",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.mood-check-in.zip",permissions:["pet:speak","pet:interact","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u6BCF\u5929\u4E00\u6B21\u6E29\u548C\u5730\u7559\u610F\u4F60\u5F53\u4E0B\u7684\u611F\u53D7\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.mood-check-in",sha256:"3d42c278126f850cd5cfdb8e814b220e84556067f4a361fe22aeb157abed34eb",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"regis.usage-buddy",title:"AI \u989D\u5EA6\u4F19\u4F34",description:"\u4ECE\u53E6\u884C\u8FD0\u884C\u7684\u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\u8BFB\u53D6 Claude\uFF0FCodex \u989D\u5EA6\uFF0C\u5E76\u6309\u914D\u7F6E\u63D0\u9192\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"Regis Benedito dos Santos Bittencourt",symbol:"\u989D",version:"1.1.0",source:"https://github.com/regisbsb/openpets-plugin-usage-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/regis.usage-buddy.zip",permissions:["pet:speak","pet:reaction","commands","status","schedule","network","network:local","storage"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u5B9A\u65F6\u8C03\u5EA6","\u7F51\u7EDC\u8BBF\u95EE","\u672C\u673A\u7F51\u7EDC","\u63D2\u4EF6\u5B58\u6863"],features:["\u4ECE\u53E6\u884C\u8FD0\u884C\u7684\u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\u8BFB\u53D6 Claude\uFF0FCodex \u989D\u5EA6\uFF0C\u5E76\u6309\u914D\u7F6E\u63D0\u9192\u3002","\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C usage-monitor-for-claude-and-codex \u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\uFF0C\u5E76\u786E\u8BA4\u63D2\u4EF6\u53EF\u8BBF\u95EE\u5176 127.0.0.1:45455 \u7AEF\u70B9\uFF1B\u63D2\u4EF6\u672C\u8EAB\u4E0D\u76F4\u63A5\u8BFB\u53D6\u4E91\u7AEF\u8D26\u53F7\u989D\u5EA6\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/regis.usage-buddy",sha256:"48e03c6b788e610e76a7ae4241e4c26bab9627171d8565a21524ea4e57feb9d0",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C usage-monitor-for-claude-and-codex \u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\uFF0C\u5E76\u786E\u8BA4\u63D2\u4EF6\u53EF\u8BBF\u95EE\u5176 127.0.0.1:45455 \u7AEF\u70B9\uFF1B\u63D2\u4EF6\u672C\u8EAB\u4E0D\u76F4\u63A5\u8BFB\u53D6\u4E91\u7AEF\u8D26\u53F7\u989D\u5EA6\u3002"},{id:"openpets.higgsfield-watch",title:"Higgsfield \u8FDB\u5EA6\u4F19\u4F34",description:"\u914D\u7F6E\u81EA\u5DF1\u7684 Higgsfield \u4EE4\u724C\u540E\uFF0C\u8BA9\u684C\u5BA0\u62A5\u544A\u56FE\u50CF\u4E0E\u89C6\u9891\u751F\u6210\u8FDB\u5EA6\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u7ED8",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.higgsfield-watch",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.higgsfield-watch.zip",permissions:["network","schedule","storage","pet:speak","pet:reaction","commands","status"],permissionLabels:["\u7F51\u7EDC\u8BBF\u95EE","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001"],features:["\u914D\u7F6E\u81EA\u5DF1\u7684 Higgsfield \u4EE4\u724C\u540E\uFF0C\u8BA9\u684C\u5BA0\u62A5\u544A\u56FE\u50CF\u4E0E\u89C6\u9891\u751F\u6210\u8FDB\u5EA6\u3002","\u9700\u8981\u7528\u6237\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u586B\u5199\u81EA\u5DF1\u7684 Higgsfield \u8BBF\u95EE\u4EE4\u724C\uFF0C\u63D2\u4EF6\u4EC5\u5411\u58F0\u660E\u7684 Higgsfield \u670D\u52A1\u67E5\u8BE2\u751F\u6210\u8FDB\u5EA6\uFF1B\u7F51\u7AD9\u4E0D\u63A5\u6536\u4EE4\u724C\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.higgsfield-watch",sha256:"31d3c85dc20396faa78311a0b2180bf927a5b65db1bd149fbe8f348fd670bda9",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u9700\u8981\u7528\u6237\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u586B\u5199\u81EA\u5DF1\u7684 Higgsfield \u8BBF\u95EE\u4EE4\u724C\uFF0C\u63D2\u4EF6\u4EC5\u5411\u58F0\u660E\u7684 Higgsfield \u670D\u52A1\u67E5\u8BE2\u751F\u6210\u8FDB\u5EA6\uFF1B\u7F51\u7AD9\u4E0D\u63A5\u6536\u4EE4\u724C\u3002"},{id:"openpets.drag-vocab",title:"\u62D6\u62FD\u8BCD\u6C47\u52A9\u624B",description:"\u62D6\u5165\u8BCD\u6C47\u67E5\u770B\u7F51\u7EDC\u91CA\u4E49\u4E0E\u7FFB\u8BD1\uFF1B\u8FDE\u63A5 AnkiConnect \u540E\u53EF\u9009\u4FDD\u5B58\u5355\u8BCD\u5361\u3002",kind:"plugin",pluginType:"sdk",category:"\u5B66\u4E60\u4E0E\u6548\u7387",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u8BCD",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.drag-vocab",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.drag-vocab.zip",permissions:["pet:speak","pet:drop","network","events","pet:reaction","pet:interact","network:local","network:write"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u62D6\u5165\u6587\u672C","\u7F51\u7EDC\u8BBF\u95EE","\u4EA4\u4E92\u4E8B\u4EF6","\u52A8\u4F5C\u53CD\u5E94","\u4E92\u52A8\u6C14\u6CE1","\u672C\u673A\u7F51\u7EDC","\u7F51\u7EDC\u5199\u5165"],features:["\u62D6\u5165\u8BCD\u6C47\u67E5\u770B\u7F51\u7EDC\u91CA\u4E49\u4E0E\u7FFB\u8BD1\uFF1B\u8FDE\u63A5 AnkiConnect \u540E\u53EF\u9009\u4FDD\u5B58\u5355\u8BCD\u5361\u3002","\u91CA\u4E49\u4E0E\u7FFB\u8BD1\u9700\u8981\u7F51\u7EDC\u8BBF\u95EE\u3002\u4FDD\u5B58\u5355\u8BCD\u5230 Anki \u4E3A\u53EF\u9009\u64CD\u4F5C\uFF0C\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C Anki \u4E0E AnkiConnect\uFF0C\u5E76\u9009\u62E9\u5BF9\u5E94\u724C\u7EC4\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.drag-vocab",sha256:"71356efce07269de28ac918c96320d6bbb558cdfd8f73176b91d2c16910ccad4",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u91CA\u4E49\u4E0E\u7FFB\u8BD1\u9700\u8981\u7F51\u7EDC\u8BBF\u95EE\u3002\u4FDD\u5B58\u5355\u8BCD\u5230 Anki \u4E3A\u53EF\u9009\u64CD\u4F5C\uFF0C\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C Anki \u4E0E AnkiConnect\uFF0C\u5E76\u9009\u62E9\u5BF9\u5E94\u724C\u7EC4\u3002"},{id:"openpets.spotify-buddy",title:"Spotify \u97F3\u4E50\u4F19\u4F34",description:"\u914D\u7F6E Spotify \u5E94\u7528 ID \u5E76\u6388\u6743\u8D26\u53F7\u540E\uFF0C\u8BA9\u684C\u5BA0\u966A\u542C\u3001\u62A5\u544A\u66F2\u76EE\u4E0E\u63A7\u5236\u64AD\u653E\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u4E50",version:"1.8.1",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.spotify-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.spotify-buddy.zip",permissions:["network","network:write","schedule","storage","pet:speak","pet:reaction","commands","status","auth","secrets","ui:toast"],permissionLabels:["\u7F51\u7EDC\u8BBF\u95EE","\u7F51\u7EDC\u5199\u5165","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u5916\u90E8\u670D\u52A1\u6388\u6743","\u672C\u673A\u79D8\u5BC6\u5B58\u50A8","\u72B6\u6001\u63D0\u793A"],features:["\u914D\u7F6E Spotify \u5E94\u7528 ID \u5E76\u6388\u6743\u8D26\u53F7\u540E\uFF0C\u8BA9\u684C\u5BA0\u966A\u542C\u3001\u62A5\u544A\u66F2\u76EE\u4E0E\u63A7\u5236\u64AD\u653E\u3002","\u9700\u8981\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u63D0\u4F9B\u53EF\u7528\u7684 Spotify \u5E94\u7528 Client ID\uFF0C\u518D\u901A\u8FC7\u63D2\u4EF6\u547D\u4EE4\u5B8C\u6210\u8D26\u53F7\u6388\u6743\uFF1B\u5F53\u524D\u6E90\u7801\u4F7F\u7528\u5BBF\u4E3B OAuth\uFF0C\u4E0D\u8981\u6C42\u65E7 README \u4E2D\u7684 ngrok \u6865\u63A5\u3002\u64AD\u653E\u63A7\u5236\u8FD8\u53D7 Spotify \u8D26\u53F7\u548C\u670D\u52A1\u6743\u9650\u9650\u5236\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.spotify-buddy",sha256:"74558f32294d028f20eb8de0993845eaf08bbb47ae60ee59b2b3288be5f99e4b",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u9700\u8981\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u63D0\u4F9B\u53EF\u7528\u7684 Spotify \u5E94\u7528 Client ID\uFF0C\u518D\u901A\u8FC7\u63D2\u4EF6\u547D\u4EE4\u5B8C\u6210\u8D26\u53F7\u6388\u6743\uFF1B\u5F53\u524D\u6E90\u7801\u4F7F\u7528\u5BBF\u4E3B OAuth\uFF0C\u4E0D\u8981\u6C42\u65E7 README \u4E2D\u7684 ngrok \u6865\u63A5\u3002\u64AD\u653E\u63A7\u5236\u8FD8\u53D7 Spotify \u8D26\u53F7\u548C\u670D\u52A1\u6743\u9650\u9650\u5236\u3002"},{id:"openpets.walkabout",title:"\u684C\u9762\u6F2B\u6B65",description:"\u6279\u51C6\u79FB\u52A8\u6743\u9650\u540E\uFF0C\u8BA9\u684C\u5BA0\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6B65",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.walkabout",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.walkabout.zip",permissions:["pet:move","events","pets:read","status"],permissionLabels:["\u684C\u5BA0\u79FB\u52A8","\u4EA4\u4E92\u4E8B\u4EF6","\u684C\u5BA0\u72B6\u6001","\u8FD0\u884C\u72B6\u6001"],features:["\u6279\u51C6\u79FB\u52A8\u6743\u9650\u540E\uFF0C\u8BA9\u684C\u5BA0\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002","\u542F\u7528\u540E\u4F1A\u6309\u914D\u7F6E\u79FB\u52A8\u684C\u5BA0\uFF0C\u9700\u8981\u6279\u51C6\u684C\u5BA0\u79FB\u52A8\u6743\u9650\uFF1B\u53EF\u9009\u62E9\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.walkabout",sha256:"6d5622f9eaf0906e591ca796b504157effe00c88c023286f7f38db2ab8d381de",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u542F\u7528\u540E\u4F1A\u6309\u914D\u7F6E\u79FB\u52A8\u684C\u5BA0\uFF0C\u9700\u8981\u6279\u51C6\u684C\u5BA0\u79FB\u52A8\u6743\u9650\uFF1B\u53EF\u9009\u62E9\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002"}],Gt=["\u6E38\u620F\u89D2\u8272","\u52A8\u6F2B\u89D2\u8272","\u5409\u7965\u7269","\u5176\u4ED6","\u673A\u5668\u4EBA","\u539F\u521B\u89D2\u8272","\u4EBA\u7269\u5934\u50CF","\u52A8\u7269\u4F19\u4F34","\u5E7B\u60F3\u751F\u7269","\u7F51\u7EDC\u6897\u56FE","\u7269\u4EF6\u4E0E\u9053\u5177"],gu=10080*60*1e3;function Jt(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)}function Ce(e,t,u,a=!1){if(typeof e!="string")throw new Error(`\u8BF7\u586B\u5199${t}\u3002`);let i=e.replace(/\r\n?/g,`
`).trim(),n=a?i.replace(/[\n\t]/g,""):i;if(!i||i.length>u||/[\p{Cc}\p{Cf}]/u.test(n))throw new Error(`${t}\u9700\u4E3A 1 \u81F3 ${u} \u5B57\u7684\u6709\u6548\u6587\u5B57\u3002`);return i}function Kt(e){if(!Jt(e))throw new Error("\u5236\u4F5C\u9700\u6C42\u683C\u5F0F\u65E0\u6548\u3002");let t=Ce(e.title,"\u89D2\u8272\u540D\u79F0",80),u=Ce(e.description,"\u521B\u4F5C\u8BF4\u660E",1e3,!0);if(!Gt.includes(e.category))throw new Error("\u8BF7\u9009\u62E9\u652F\u6301\u7684\u89D2\u8272\u5206\u7C7B\u3002");let a=e.version===1||e.version==="1"?1:e.version===2||e.version==="2"?2:null;if(a===null)throw new Error("\u8BF7\u9009\u62E9 V1 \u6216 V2 \u56FE\u96C6\u3002");return{title:t,description:u,category:e.category,version:a}}var se=new Map([...Wt,...Zt,...Vt,...Yt.map(e=>({...e,kind:"plugin",download:`assets/${e.id}.zip`}))].map(e=>[e.id,e])),O=32*1024*1024,V=O+10*1024*1024+65536,te=!1,F=class extends Error{constructor(e,t=400){super(e),this.status=t}},T=(e,t=200)=>Response.json(e,{status:t,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});function M(e){if(!e.DB)throw new F("\u5171\u521B\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",503);return e.DB}function ue(e,t,u){if(typeof e!="string"||!e.trim()||e.length>u||/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\p{Cf}]/u.test(e))throw new F(`${t}\u683C\u5F0F\u4E0D\u6B63\u786E\u3002`);return e.trim()}function G(e,t="plugin"){if(t==="pet"){let u=JSON.parse(e.presentation);return{id:e.id,kind:t,title:e.title,description:e.description,author:e.author,license:e.license,category:"\u793E\u533A\u4F5C\u54C1",tags:["\u793E\u533A\u4F5C\u54C1"],thumbnail:e.cover_key?`/api/pets/${e.id}/cover`:"assets/brand-logo.png",download:`/api/pets/${e.id}/download`,atlas:u.atlas?`/api/pets/${e.id}/media/atlas`:null,version:u.version,mediaActions:Object.fromEntries(Object.entries(u.media||{}).map(([a,i])=>[a,{displayName:typeof i.displayName=="string"&&i.displayName.trim()&&i.displayName.length<=80&&!/[\p{Cc}\p{Cf}]/u.test(i.displayName)?i.displayName:a,type:i.type,url:`/api/pets/${e.id}/media/${a}`}])),hostNotice:e.compatibility,publishedAt:e.created_at}}return{id:e.id,kind:"plugin",name:e.title,title:e.title,description:e.description,author:e.author,license:e.license,source:e.source,pluginType:"community-plugin",category:"\u793E\u533A\u4F5C\u54C1",tags:["\u793E\u533A\u4F5C\u54C1"],features:[],permissions:[],hostNotice:e.compatibility,cover:e.cover_key?`/api/plugins/${e.id}/cover`:null,download:`/api/plugins/${e.id}/download`,publishedAt:e.created_at,packageBytes:e.size}}async function Qt(e){if(!e.headers.get("content-type")?.startsWith("multipart/form-data;"))throw new F("\u8BF7\u4F7F\u7528\u4F5C\u54C1\u4E0A\u4F20\u8868\u5355\u3002");if(Number(e.headers.get("content-length"))>V)throw new F("\u4E0A\u4F20\u603B\u91CF\u8D85\u8FC7\u9650\u5236\u3002",413);let t=0,u=e.body?.pipeThrough(new TransformStream({transform(a,i){if(t+=a.byteLength,t>V)throw new F("\u4E0A\u4F20\u603B\u91CF\u8D85\u8FC7\u9650\u5236\u3002",413);i.enqueue(a)}}));if(!u)throw new F("\u6CA1\u6709\u6536\u5230\u4F5C\u54C1\u6587\u4EF6\u3002");try{return await new Response(u,{headers:{"content-type":e.headers.get("content-type")}}).formData()}catch{throw new F(t>V?"\u4E0A\u4F20\u603B\u91CF\u8D85\u8FC7\u9650\u5236\u3002":"\u4E0A\u4F20\u672A\u5B8C\u6210\u6216\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u63D0\u4EA4\u3002",t>V?413:400)}}async function H(e){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",e)),t=>t.toString(16).padStart(2,"0")).join("")}async function je(e,t){if(!e.body||t>O)throw new Error("\u56FA\u5B9A\u539F\u4EF6\u5927\u5C0F\u65E0\u6548\u3002");let u=e.body.getReader(),a=[],i=0;for(;;){let{value:o,done:r}=await u.read();if(r)break;if(i+=o.length,i>t)throw await u.cancel(),new Error("\u56FA\u5B9A\u539F\u4EF6\u8D85\u8FC7\u957F\u5EA6\u3002");a.push(o)}if(i!==t)throw new Error("\u56FA\u5B9A\u539F\u4EF6\u957F\u5EA6\u4E0D\u4E00\u81F4\u3002");let n=new Uint8Array(i),s=0;for(let o of a)n.set(o,s),s+=o.length;return n}async function ne(e,t){let u=$e[new URL(e.url).pathname];if(!u)return t.ASSETS?t.ASSETS.fetch(e):fetch(e);let a={"content-type":"application/zip","content-length":String(u.size),"cache-control":"public, max-age=86400","x-content-type-options":"nosniff",etag:`"${u.sha256}"`};if(e.method==="HEAD")return new Response(null,{headers:a});let i=await fetch(new Request(u.sourceUrl,{redirect:"error",signal:AbortSignal.timeout(2e4)}));if(!i.ok)return new Response("\u4E0B\u8F7D\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",{status:404});let n=await je(i,u.atlasSize);if(await H(n)!==u.atlasSha256)throw new Error("\u56FA\u5B9A\u56FE\u96C6\u6458\u8981\u4E0D\u4E00\u81F4\u3002");let s=Uint8Array.from(atob(u.prefix),c=>c.charCodeAt(0)),o=Uint8Array.from(atob(u.suffix),c=>c.charCodeAt(0)),r=new Uint8Array(s.length+n.length+o.length);if(r.set(s),r.set(n,s.length),r.set(o,s.length+n.length),r.length!==u.size||await H(r)!==u.sha256)throw new Error("\u539F\u4E0B\u8F7D\u5305\u6458\u8981\u4E0D\u4E00\u81F4\u3002");return new Response(r,{headers:a})}async function Xt(e,t,u,a){let i={"content-type":"image/webp","content-length":String(a.size),"cache-control":"public, max-age=86400","x-content-type-options":"nosniff",etag:`"${a.sha256}"`};if(e.method==="HEAD")return new Response(null,{headers:i});let n=new Request(new URL(a.zip,u.origin)),s=await ne(n,t);if(!s.ok)return new Response("\u56FE\u96C6\u6682\u4E0D\u53EF\u7528\u3002",{status:404});let o=await je(s,a.packageSize);if(await H(o)!==a.packageSha256)throw new Error("\u5185\u7F6E\u539F\u5305\u6458\u8981\u4E0D\u4E00\u81F4\u3002");let c=(await Ie(o,()=>{throw new Error("\u5185\u7F6E\u539F\u5305\u683C\u5F0F\u65E0\u6548\u3002")},{maxTotalBytes:O,maxFileBytes:O}))[a.filename];if(!c||c.length!==a.size||await H(c)!==a.sha256)throw new Error("\u5185\u7F6E\u56FE\u96C6\u6458\u8981\u4E0D\u4E00\u81F4\u3002");return new Response(c,{headers:i})}async function W(e){try{return await e()}catch(t){throw t instanceof F?t:new F(t.message||"\u4F5C\u54C1\u6587\u4EF6\u65E0\u6548\u3002")}}async function eu(e,t,u){let a=[JSON.stringify(t)];for(let i of Object.keys(e).sort()){let n=e[i];if(/^WORK-INFO(?:-\d+)?\.json$/.test(i)&&n.length<=65536)try{let s=JSON.parse(new TextDecoder().decode(n));delete s.savedAt,n=new TextEncoder().encode(JSON.stringify(s))}catch{}a.push(i,await H(n))}return u&&a.push(await H(u)),H(new TextEncoder().encode(a.join(`
`)))}async function tu(e,t,u="plugin"){let a=u==="pet"?"community_pets":"community_plugins",i=e.headers.get("oai-authenticated-user-id");if(!i)throw new F("\u8BF7\u5148\u767B\u5F55\uFF0C\u518D\u53D1\u5E03\u4F5C\u54C1\u3002",401);let n=new URL(e.url);if(e.headers.get("origin")!==n.origin||e.headers.get("sec-fetch-site")==="cross-site")throw new F("\u8BF7\u4ECE\u5171\u521B\u5E73\u53F0\u63D0\u4EA4\u4F5C\u54C1\u3002",403);let s=M(t);if(!t.BUCKET)throw new F("\u6295\u7A3F\u5B58\u50A8\u5C1A\u672A\u542F\u7528\uFF0C\u8BF7\u4FDD\u7559\u4F5C\u54C1\u540E\u91CD\u8BD5\u3002",503);if(te)throw new F("\u5F53\u524D\u4E0A\u4F20\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF1B\u4F5C\u54C1\u4ECD\u4FDD\u7559\u5728\u9875\u9762\u3002",503);te=!0;try{let o=await Qt(e),r=o.get("metadata");if(typeof r!="string"||r.length>16384)throw new F("\u4F5C\u54C1\u4FE1\u606F\u7F3A\u5931\u6216\u8FC7\u5927\u3002");let c;try{c=JSON.parse(r)}catch{throw new F("\u4F5C\u54C1\u4FE1\u606F\u683C\u5F0F\u4E0D\u6B63\u786E\u3002")}let l={title:ue(c?.title,"\u540D\u79F0",120),id:ue(c?.id,"\u4F5C\u54C1 ID",64),description:ue(c?.description,"\u8BF4\u660E",1e3),...await W(()=>Te(c)),workflow:c.workflow};if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(l.id)||![`${u}-make`,`${u}-import`].includes(l.workflow))throw new F("\u4F5C\u54C1\u7F16\u53F7\u6216\u6295\u7A3F\u5165\u53E3\u65E0\u6548\u3002");let b=o.get("package");if(!(b instanceof Blob)||!b.size||b.size>O)throw new F("\u516C\u5F00\u6295\u7A3F\u7684 ZIP \u6700\u5927\u4E3A 32 MB\u3002",413);let d=new Uint8Array(await b.arrayBuffer()),g=await W(()=>Ie(d,()=>{throw new F("\u8BF7\u901A\u8FC7\u5E73\u53F0\u91CD\u65B0\u6253\u5305\u540E\u53D1\u5E03\uFF0C\u4E0D\u63A5\u53D7\u76F4\u63A5\u63D0\u4EA4\u7684\u538B\u7F29\u6D41\u3002")},{maxTotalBytes:O,maxFileBytes:O}));if(!Object.keys(g).length||Object.values(g).reduce((A,B)=>A+B.length,0)>O)throw new F("\u4F5C\u54C1\u6587\u4EF6\u8D85\u8FC7 32 MB\u3002",413);let h=await W(()=>ze(g,u));if(l.workflow===`${u}-make`&&h.report.level!=="native")throw new F("\u5236\u4F5C\u4F5C\u54C1\u9700\u7B26\u5408\u672C\u7CFB\u7EDF\u683C\u5F0F\uFF1B\u5176\u4ED6\u683C\u5F0F\u8BF7\u4F7F\u7528\u5BFC\u5165\u5165\u53E3\u3002");l.workflow===`${u}-make`&&await W(()=>qt(g,{...l,displayName:l.title},u,l.workflow));let z,j,m=o.get("cover");if(m instanceof Blob&&m.size){if(m.size>10*1024*1024)throw new F("\u5C01\u9762\u6700\u5927\u4E3A 10 MB\u3002",413);z=new Uint8Array(await m.arrayBuffer()),j=(await W(()=>de(z))).mime}else h.cover&&(z=h.cover.bytes,j=h.cover.mime);let y=await eu(g,l,z),E=await s.prepare(`SELECT * FROM ${a} WHERE owner = ? AND fingerprint = ?`).bind(i,y).first();if(E)return T({item:G(E,u),alreadyPublished:!0});if((await s.prepare(`SELECT COUNT(*) AS total FROM ${a} WHERE owner = ? AND created_at >= ?`).bind(i,new Date(Date.now()-36e5).toISOString()).first()).total>=20)throw new F("\u672C\u5C0F\u65F6\u6295\u7A3F\u5DF2\u8FBE 20 \u4EF6\uFF0C\u8BF7\u7A0D\u540E\u7EE7\u7EED\u3002",429);let N=`community-${crypto.randomUUID()}`,v=`${u}s/${N}/package.zip`,w=z?`${u}s/${N}/cover`:null,I={version:h.manifest.spriteVersionNumber===2?2:1,media:{}},S=[];if(u==="pet"&&h.report.capabilities.preview)if(h.manifest.mediaVersion===1)for(let[A,B]of Object.entries(h.manifest.actions)){let C=B.toLowerCase().endsWith(".mp4")?"video/mp4":B.toLowerCase().endsWith(".webm")?"video/webm":"image/webp";I.media[A]={key:`pets/${N}/media/${A}`,file:h.assetPrefix+B,type:C,displayName:h.manifest.actionDefinitions?.[A]?.displayName||A}}else I.atlas={key:`pets/${N}/media/atlas`,file:h.assetPrefix+(h.manifest.spritesheetPath||"spritesheet.webp"),type:"image/webp"};try{await t.BUCKET.put(v,d,{httpMetadata:{contentType:"application/zip"}}),w&&await t.BUCKET.put(w,z,{httpMetadata:{contentType:j}});for(let B of[...Object.values(I.media),...I.atlas?[I.atlas]:[]])S.push(B.key),await t.BUCKET.put(B.key,g[B.file],{httpMetadata:{contentType:B.type}});let A=[N,i,y,l.id,l.title,l.description,l.author,l.license,l.source,l.workflow,h.report.level==="native"?"\u53EF\u5728 desktop pet \u5BFC\u5165\uFF1B\u542F\u7528\u524D\u8BF7\u786E\u8BA4\u6743\u9650\u3002":"\u4FDD\u7559\u539F\u9879\u76EE\u683C\u5F0F\uFF0C\u8BF7\u6309\u539F\u9879\u76EE\u8BF4\u660E\u5728\u539F\u5BBF\u4E3B\u4F7F\u7528\u3002\u672C\u7CFB\u7EDF\u76F8\u5173\u8FD0\u884C\u64CD\u4F5C\u4E0D\u53EF\u7528\u3002",v,w,j||null,b.size,new Date().toISOString()];u==="pet"&&A.push(JSON.stringify(I)),await s.prepare(`INSERT INTO ${a} (id, owner, fingerprint, work_id, title, description, author, license, source, workflow, compatibility, package_key, cover_key, cover_mime, size, created_at${u==="pet"?", presentation":""}) VALUES (${A.map(()=>"?").join(", ")})`).bind(...A).run()}catch(A){let B=await s.prepare(`SELECT * FROM ${a} WHERE owner = ? AND fingerprint = ?`).bind(i,y).first();if(B)return B.package_key!==v&&await t.BUCKET.delete([v,...w?[w]:[],...S]),T({item:G(B,u),alreadyPublished:!0});throw await t.BUCKET.delete([v,...w?[w]:[],...S]),A}return T({item:G(await s.prepare(`SELECT * FROM ${a} WHERE id = ?`).bind(N).first(),u)},201)}finally{te=!1}}function He(e){let t=e.headers.get("oai-authenticated-user-id");if(!t)throw new F("\u8BF7\u5148\u767B\u5F55\u3002",401);if(e.headers.get("origin")!==new URL(e.url).origin||e.headers.get("sec-fetch-site")==="cross-site")throw new F("\u8BF7\u4ECE\u5171\u521B\u5E73\u53F0\u63D0\u4EA4\u3002",403);return t}async function Pe(e){let t=e.body?.getReader();if(!t)throw new F("\u5185\u5BB9\u7F3A\u5931\u3002");let u=0,a="",i=new TextDecoder;for(;;){let{done:n,value:s}=await t.read();if(n)break;if(u+=s.length,u>16384)throw await t.cancel(),new F("\u5185\u5BB9\u8FC7\u5927\u3002",413);a+=i.decode(s,{stream:!0})}try{return JSON.parse(a+i.decode())}catch{throw new F("\u5185\u5BB9\u683C\u5F0F\u65E0\u6548\u3002")}}function J(e){return{id:e.id,title:e.title,description:e.description,category:e.category,version:e.version,createdAtISO:e.created_at,status:"waiting",public:!0}}async function uu(e,t){let u=He(e),a=M(t),i=await W(async()=>Kt(await Pe(e))),n=await H(new TextEncoder().encode(JSON.stringify(i))),s=await a.prepare("SELECT * FROM community_requests WHERE owner = ? AND fingerprint = ?").bind(u,n).first();if(s)return T({item:J(s),alreadyPublished:!0});if((await a.prepare("SELECT COUNT(*) AS total FROM community_requests WHERE owner = ? AND created_at >= ?").bind(u,new Date(Date.now()-36e5).toISOString()).first()).total>=20)throw new F("\u672C\u5C0F\u65F6\u9700\u6C42\u6295\u7A3F\u5DF2\u8FBE 20 \u9879\u3002",429);let r=`request-${crypto.randomUUID()}`,c=new Date().toISOString();try{await a.prepare("INSERT INTO community_requests (id, owner, fingerprint, title, description, category, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(r,u,n,i.title,i.description,i.category,i.version,c).run()}catch(l){let b=await a.prepare("SELECT * FROM community_requests WHERE owner = ? AND fingerprint = ?").bind(u,n).first();if(b)return T({item:J(b),alreadyPublished:!0});throw l}return T({item:J({id:r,...i,created_at:c})},201)}async function au(e,t){return se.has(t)?se.get(t):/^community-[a-f0-9-]{36}$/.test(t)?await e.prepare("SELECT id FROM community_plugins WHERE id = ?").bind(t).first()||await e.prepare("SELECT id FROM community_pets WHERE id = ?").bind(t).first():null}function ae(e){let t=/(?:^|;\s*)pet-visitor=([a-f0-9-]{36})(?:;|$)/.exec(e.headers.get("cookie")||"")?.[1],u=t||crypto.randomUUID();return{id:u,cookie:t?null:`pet-visitor=${u}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`}}async function we(e,t,u,a){let i=new Date().toISOString(),n=await H(new TextEncoder().encode(e.headers.get("oai-authenticated-user-id")||a.id));try{await M(t).prepare("INSERT INTO community_downloads (id, work_id, actor, day, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(work_id, actor, day) DO NOTHING").bind(crypto.randomUUID(),u,n,i.slice(0,10),i).run()}catch{console.error("\u4E0B\u8F7D\u7EDF\u8BA1\u8BB0\u5F55\u5931\u8D25\uFF0C\u4E0B\u8F7D\u6587\u4EF6\u7EE7\u7EED\u8FD4\u56DE\u3002")}}async function Ue(e,t){let u=M(t),a=new Date(Date.now()-7*864e5).toISOString(),i=e.headers.get("oai-authenticated-user-id"),[n,s,o]=await Promise.all([u.prepare("SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_likes GROUP BY work_id").bind(a).all(),u.prepare("SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_downloads GROUP BY work_id").bind(a).all(),i?u.prepare("SELECT work_id FROM community_likes WHERE actor = ?").bind(await H(new TextEncoder().encode(i))).all():{results:[]}]),r=Object.create(null),c=new Set(o.results.map(l=>l.work_id));for(let[l,b]of[[n.results,"likes"],[s.results,"downloads"]])for(let d of l){let g=r[d.work_id]||={likes:0,downloads:0,weekly:0,liked:c.has(d.work_id)};g[b]=d.total,g.weekly+=d.week}return T({items:r,scope:"site",downloadRule:"\u540C\u4E00\u8D26\u6237\u6216\u6D4F\u89C8\u5668\u6BCF\u5929\u5BF9\u540C\u4E00\u4F5C\u54C1\u8BA1\u4E00\u6B21\u4E0B\u8F7D"})}async function iu(e,t,u){let a=He(e),i=M(t),n=await Pe(e);if(!await au(i,u))throw new F("\u4F5C\u54C1\u4E0D\u5B58\u5728\u3002",404);if(typeof n.liked!="boolean")throw new F("\u70B9\u8D5E\u72B6\u6001\u65E0\u6548\u3002");let s=await H(new TextEncoder().encode(a));return n.liked?await i.prepare("INSERT INTO community_likes (id, work_id, actor, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(work_id, actor) DO NOTHING").bind(crypto.randomUUID(),u,s,new Date().toISOString()).run():await i.prepare("DELETE FROM community_likes WHERE work_id = ? AND actor = ?").bind(u,s).run(),Ue(e,t)}var Oe={async fetch(e,t){let u=new URL(e.url);try{if(u.pathname==="/api/session"&&e.method==="GET"){let r=T({available:!!t.DB&&!!t.BUCKET,signedIn:!!e.headers.get("oai-authenticated-user-id"),maxPackageBytes:O}),c=ae(e);return c.cookie&&r.headers.set("set-cookie",c.cookie),r}if(u.pathname==="/api/activity"&&e.method==="GET")return await Ue(e,t);let a=/^\/api\/works\/([a-zA-Z0-9._-]{1,80})\/like$/.exec(u.pathname);if(a&&e.method==="POST")return await iu(e,t,a[1]);if(u.pathname==="/api/requests"){if(e.method==="POST")return await uu(e,t);if(e.method!=="GET")return T({error:"\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C\u3002"},405);let r=await M(t).prepare("SELECT * FROM community_requests ORDER BY created_at DESC LIMIT 500").all();return T({items:r.results.map(J)})}if(["/api/plugins","/api/pets"].includes(u.pathname)){let r=u.pathname==="/api/pets"?"pet":"plugin";if(e.method==="POST")return await tu(e,t,r);if(e.method!=="GET")return T({error:"\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C\u3002"},405);let c=await M(t).prepare(`SELECT * FROM community_${r}s ORDER BY created_at DESC LIMIT 500`).all();return T({items:c.results.map(l=>G(l,r))})}let i=/^\/api\/download\/([a-zA-Z0-9._-]{1,80})$/.exec(u.pathname);if(i&&["GET","HEAD"].includes(e.method)){let r=se.get(i[1]);if(!r)return T({error:"\u6587\u4EF6\u4E0D\u5B58\u5728\u3002"},404);let c=new URL(r.download,u.origin+"/");if(c.origin!==u.origin||!/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9._-]+\.zip$/.test(c.pathname))return T({error:"\u4F5C\u54C1\u5730\u5740\u65E0\u6548\u3002"},404);let l=new Request(c,{method:e.method}),b=await ne(l,t),d=new Response(b.body,b);if(d.headers.set("cache-control","no-store"),b.ok&&e.method==="GET"){let g=ae(e);await we(e,t,r.id,g),g.cookie&&d.headers.set("set-cookie",g.cookie)}return d}let n=/^\/api\/(plugins|pets)\/(community-[a-f0-9-]{36})\/(download|cover|media\/[a-z0-9_-]{1,64})$/.exec(u.pathname);if(n&&["GET","HEAD"].includes(e.method)){let r=await M(t).prepare(`SELECT * FROM community_${n[1]} WHERE id = ?`).bind(n[2]).first(),c=r?.presentation?JSON.parse(r.presentation):{},l=c.media?.[n[3].slice(6)]||(n[3]==="media/atlas"?c.atlas:null),b=r&&(n[3]==="cover"?r.cover_key:n[3]==="download"?r.package_key:l?.key);if(!b)return T({error:"\u4F5C\u54C1\u4E0D\u5B58\u5728\u3002"},404);let d=await t.BUCKET.get(b);if(!d)return T({error:"\u6587\u4EF6\u6682\u4E0D\u53EF\u7528\u3002"},404);let g=ae(e),h=n[3]==="download";return h&&e.method==="GET"&&await we(e,t,r.id,g),new Response(e.method==="HEAD"?null:d.body,{headers:{"content-type":n[3]==="cover"?r.cover_mime:h?"application/zip":l.type,"content-length":String(d.size),"cache-control":h?"no-store":"public, max-age=300","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; sandbox",...h?{"content-disposition":`attachment; filename="${r.work_id.replace(/[^a-zA-Z0-9._-]/g,"-")}.zip"`,...g.cookie?{"set-cookie":g.cookie}:{}}:{}}})}if(u.pathname.startsWith("/api/"))return T({error:"\u63A5\u53E3\u4E0D\u5B58\u5728\u3002"},404);if(!["GET","HEAD"].includes(e.method))return new Response("\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C\u3002",{status:405});let s=Object.hasOwn(Fe,u.pathname)&&Fe[u.pathname];if(s)return await Xt(e,t,u,s);if(Object.hasOwn($e,u.pathname))return await ne(e,t);let o=_t[u.pathname];return o?new Response(e.method==="HEAD"?null:o.body,{headers:{"content-type":o.type,"x-content-type-options":"nosniff","cache-control":"no-cache"}}):t.ASSETS?t.ASSETS.fetch(e):new Response("\u6587\u4EF6\u4E0D\u5B58\u5728\u3002",{status:404})}catch(a){return a instanceof F?T({error:a.message},a.status):(console.error("\u5171\u521B\u670D\u52A1\u8BF7\u6C42\u5931\u8D25",a?.name),T({error:"\u53D1\u5E03\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u4FDD\u7559\u6587\u4EF6\u548C\u8349\u7A3F\u540E\u91CD\u8BD5\u3002"},503))}}};var Me=[{id:"community.water-break",title:"\u559D\u6C34\u5C0F\u63D0\u9192",description:"\u5FD9\u788C\u7684\u65F6\u5019\uFF0C\u4E5F\u8BB0\u5F97\u559D\u53E3\u6C34\u3002\u95F4\u9694\u548C\u53F0\u8BCD\u90FD\u53EF\u91CD\u65B0\u521B\u4F5C\u3002",everyMinutes:45,speech:"\u559D\u53E3\u6C34\uFF0C\u4F11\u606F\u4E00\u4E0B\u5427\u3002",reaction:"waving",category:"\u5065\u5EB7\u63D0\u9192",symbol:"\u6C34"},{id:"community.eye-break",title:"\u8FDC\u773A\u4E00\u5206\u949F",description:"\u628A\u89C6\u7EBF\u4ECE\u5C4F\u5E55\u79FB\u5F00\uFF0C\u8BA9\u773C\u775B\u548C\u684C\u5BA0\u4E00\u8D77\u4F11\u606F\u3002",everyMinutes:20,speech:"\u770B\u770B\u8FDC\u5904\uFF0C\u8BA9\u773C\u775B\u4F11\u606F\u4E00\u4E0B\u3002",reaction:"idle",category:"\u5065\u5EB7\u63D0\u9192",symbol:"\u76EE"},{id:"community.focus-break",title:"\u4E13\u6CE8\u540E\u4F11\u606F",description:"\u6BCF\u9694\u4E00\u6BB5\u65F6\u95F4\u6E29\u548C\u63D0\u9192\u4F11\u606F\u3002\u5468\u671F\u91CD\u590D\u8FD0\u884C\uFF0C\u53EF\u5728\u672C\u5730\u505C\u7528\u3002",everyMinutes:25,speech:"\u4E00\u6BB5\u4E13\u6CE8\u7ED3\u675F\u5566\uFF0C\u7AD9\u8D77\u6765\u6D3B\u52A8\u4E00\u4E0B\u3002",reaction:"celebrating",category:"\u4E13\u6CE8\u966A\u4F34",symbol:"\u6B47"}];var Q="Lykinzlj";var qe=[{id:"firefly--lingxiaotian",title:"\u6D41\u8424",englishTitle:"Firefly",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u6D41\u8424\u53D8\u8EAB\u524D\u7684\u4EBA\u7C7B\u5F62\u6001 Codex \u6570\u7801\u5BA0\u7269\uFF0C\u6E29\u67D4\u3001\u8F7B\u76C8\u3001\u767D\u7EFF\u91D1\u914D\u8272\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/firefly--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/firefly--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","firefly","white-hair","mint-green"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/firefly--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/firefly--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/firefly--lingxiaotian",spritesheetSha256:"bd0a0deea6bfac69cfd6ebbec02e254536a6276a3958e5794a1b256aed074583",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"acheron--lingxiaotian",title:"\u9EC4\u6CC9",englishTitle:"Acheron",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9EC4\u6CC9\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u9ED1\u957F\u53D1\u3001\u7EA2\u8272\u53D1\u9970\u3001\u767D\u9ED1\u670D\u88C5\u548C\u51B7\u9759\u950B\u5229\u7684\u5200\u7CFB\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/acheron--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/acheron--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","acheron","sword","purple"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/acheron--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/acheron--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/acheron--lingxiaotian",spritesheetSha256:"fc34319c614cebcfbd7efabb10b9bcebaef039bc487c243402b791f607c9cfda",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"aemeath-mini--cunuo",title:"Aemeath Mini",englishTitle:"Aemeath Mini",description:"A Q-style pixel Aemeath companion with soft expressions and small animated desktop-pet motions.",category:"\u5409\u7965\u7269",author:"cuNuo",authorHandle:"cuNuo",kind:"pet",atlas:"assets/pets/upstream-20261009/aemeath-mini--cunuo.webp",thumbnail:"assets/pets/upstream-20261009/aemeath-mini--cunuo-thumb.webp",version:1,tags:["aemeath","pixel-art","q-style","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/aemeath-mini--cunuo",license:"MIT License",download:"assets/pets/upstream-20261009/aemeath-mini--cunuo.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/aemeath-mini--cunuo",spritesheetSha256:"f6b2677b8e16bf1b73b0425e60bb6439bac803e108e073ef9b9dc128a762a1dc",metadataNameAlias:!1,authorUrl:"https://github.com/cuNuo"},{id:"apu--xchangee",title:"Apu",englishTitle:"Apu",description:"A round blue-and-yellow helper pet with a little hat, soft expressions, and cheerful Codex work animations.",category:"\u5409\u7965\u7269",author:"tal",authorHandle:"xchangee",kind:"pet",atlas:"assets/pets/upstream-20261009/apu--xchangee.webp",thumbnail:"assets/pets/upstream-20261009/apu--xchangee-thumb.webp",version:1,tags:["apu","helper","round","cute","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/apu--xchangee",license:"MIT License",download:"assets/pets/upstream-20261009/apu--xchangee.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/apu--xchangee",spritesheetSha256:"315868428da4962bc38bc9ce0c5e6c1ff7e52bd548b3e5ef1a527469b73f1ab6",metadataNameAlias:!1,authorUrl:"https://github.com/xchangee"},{id:"arlecchino--lingxiaotian",title:"\u963F\u857E\u5947\u8BFA",englishTitle:"Arlecchino",description:"\u300A\u539F\u795E\u300B\u963F\u857E\u5947\u8BFA\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9ED1\u767D\u7EA2\u914D\u8272\u3001\u77ED\u62AB\u98CE\u4E0E\u51B7\u5CFB\u950B\u5229\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/arlecchino--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/arlecchino--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","arlecchino","black-white-red","stern"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arlecchino--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/arlecchino--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/arlecchino--lingxiaotian",spritesheetSha256:"aa311d2686e3a8fc7edbbbcaff2e824f821582a27694d7385c2c1416de6622e4",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"becky--natewanggg",title:"Becky",englishTitle:"Becky",description:"A slim dark-gray mackerel tabby Codex pet based on Becky, with curled ears, very round pale yellow eyes, black paw pads, and a thin ring-striped tail.",category:"\u52A8\u7269\u4F19\u4F34",author:"NateWanggg",authorHandle:"NateWanggg",kind:"pet",atlas:"assets/pets/upstream-20261009/becky--natewanggg.webp",thumbnail:"assets/pets/upstream-20261009/becky--natewanggg-thumb.webp",version:1,tags:["cat","tabby","becky","original-pet","dark-gray"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/becky--natewanggg",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/becky--natewanggg.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/becky--natewanggg",spritesheetSha256:"8e76db46a3712cabf22e426202307d8467f925d3f40d9116070345095add04f6",metadataNameAlias:!1,authorUrl:"https://github.com/NateWanggg"},{id:"black-swan--lingxiaotian",title:"\u9ED1\u5929\u9E45",englishTitle:"Black Swan",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9ED1\u5929\u9E45\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7EB1\u5E3D\u3001\u7D2B\u9ED1\u793C\u670D\u4E0E\u795E\u79D8\u5360\u535C\u5E08\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/black-swan--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/black-swan--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","black-swan","mystic","veil"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/black-swan--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/black-swan--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/black-swan--lingxiaotian",spritesheetSha256:"531944d7a896777932ee15ea2480874e15a9112dc6319b4243e380de31c53ab5",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"bubu--gbn666",title:"Bubu",englishTitle:"Bubu",description:"A soft, sleepy milk-tea-brown chibi bear desktop pet with warm cheek patches and relaxed pixel-art motions.",category:"\u52A8\u7269\u4F19\u4F34",author:"Guo Beining",authorHandle:"gbn666",kind:"pet",atlas:"assets/pets/upstream-20261009/bubu--gbn666.webp",thumbnail:"assets/pets/upstream-20261009/bubu--gbn666-thumb.webp",version:1,tags:["bear","chibi","pixel-art","sleepy","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu--gbn666",license:"MIT License",download:"assets/pets/upstream-20261009/bubu--gbn666.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/bubu--gbn666",spritesheetSha256:"6eecf5d23b066a24172017232144f717e674c6a493d12de126399837ef22db6f",metadataNameAlias:!1,authorUrl:"https://github.com/gbn666"},{id:"buttercup--legeling",title:"\u6BDB\u6BDB",englishTitle:"Buttercup",description:"A classic green Powerpuff Girl with black flipped hair and a confident expression.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/buttercup--legeling.webp",thumbnail:"assets/pets/upstream-20261009/buttercup--legeling-thumb.webp",version:2,tags:["community-request","powerpuff-girls","buttercup"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/buttercup--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/buttercup--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/buttercup--legeling",spritesheetSha256:"8eadf67be926a4c3fca15daac6844022c9582421bc690e93e32523386f5d8635",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"castorice--lingxiaotian",title:"\u9050\u8776",englishTitle:"Castorice",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u9050\u8776\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u9ED1\u914D\u8272\u3001\u8776\u5F62\u610F\u8C61\u3001\u957F\u53D1\u8F6E\u5ED3\u548C\u67D4\u548C\u795E\u79D8\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/castorice--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/castorice--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","castorice","butterfly","purple"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/castorice--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/castorice--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/castorice--lingxiaotian",spritesheetSha256:"99c0b3504aad7f38dd239cae49412ed39a4c23ae3c24fd052e83a74bb6866372",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"chud-codex--jorge-cuevas90003",title:"Chud Codex",englishTitle:"Chud Codex",description:"An original grimdark chibi sci-fi cadet in black-and-brass armor with a glowing red visor and an absurdly serious attitude.",category:"\u539F\u521B\u89D2\u8272",author:"Jorge",authorHandle:"Jorge-Cuevas90003",kind:"pet",atlas:"assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.webp",thumbnail:"assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003-thumb.webp",version:2,tags:["grimdark","sci-fi","cadet","armored","chibi","original","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/chud-codex--jorge-cuevas90003",license:"CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge; no third-party source assets were used.",download:"assets/pets/upstream-20261009/chud-codex--jorge-cuevas90003.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/chud-codex--jorge-cuevas90003",spritesheetSha256:"e1211e3317065e70ef342f97fcc37337036c1e41ab2818db5c8c378c976dfc79",metadataNameAlias:!1,authorUrl:"https://github.com/Jorge-Cuevas90003"},{id:"citlali--zaytsevzy",title:"\u831C\u7279\u83C8\u8389",englishTitle:"Citlali",description:"\u5750\u5728\u4F0A\u5179\u5E15\u5E15\u4E0A\u7684\u50CF\u7D20\u831C\u7279\u83C8\u8389\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"ZaytsevZY",authorHandle:"ZaytsevZY",kind:"pet",atlas:"assets/pets/upstream-20261009/citlali--zaytsevzy.webp",thumbnail:"assets/pets/upstream-20261009/citlali--zaytsevzy-thumb.webp",version:2,tags:["anime","genshin-impact","citlali","pixel-art","reading"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/citlali--zaytsevzy",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/citlali--zaytsevzy.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/citlali--zaytsevzy",spritesheetSha256:"9fbe935730ba52af3e80a41e6a698391b73d2a872c9fcf2a7ce9c44e9ec98ed3",metadataNameAlias:!1,authorUrl:"https://github.com/ZaytsevZY"},{id:"claude--xiangking",title:"Claude",englishTitle:"Claude",description:"A tiny orange blocky digital pet with stubby side arms, short legs, and expressive pixel-art poses.",category:"\u5409\u7965\u7269",author:"XiangWang",authorHandle:"xiangking",kind:"pet",atlas:"assets/pets/upstream-20261009/claude--xiangking.webp",thumbnail:"assets/pets/upstream-20261009/claude--xiangking-thumb.webp",version:1,tags:["orange","pixel-art","blocky","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/claude--xiangking",license:"MIT License",download:"assets/pets/upstream-20261009/claude--xiangking.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/claude--xiangking",spritesheetSha256:"ddab2df6b9f7c52267f6baad85d4c3a5ccceccae6ac1b0f325e97bb5348e0e75",metadataNameAlias:!1,authorUrl:"https://github.com/xiangking"},{id:"codexy--z19t",title:"\u7801\u7075",englishTitle:"Codexy",description:"An original mint-haired Codex AI assistant with hardworking task animations and a complete 16-direction look loop.",category:"\u539F\u521B\u89D2\u8272",author:"z19t",authorHandle:"z19t",kind:"pet",atlas:"assets/pets/upstream-20261009/codexy--z19t.webp",thumbnail:"assets/pets/upstream-20261009/codexy--z19t-thumb.webp",version:2,tags:["ai-assistant","anime","coding","codex","mint-hair","original","terminal-companion","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/codexy--z19t",license:"CC BY-NC 4.0. Original AI-generated artwork independently created and adapted by z19t; non-commercial use only.",download:"assets/pets/upstream-20261009/codexy--z19t.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/codexy--z19t",spritesheetSha256:"e65f68c7e7f9c8dc858e8d601f39bbe4942e3dbb889d61a06868c69289f8d1e4",metadataNameAlias:!1,authorUrl:"https://github.com/z19t"},{id:"corgi-companion--cxian0928-afk",title:"Corgi Companion",englishTitle:"Corgi Companion",description:"A cheerful corgi companion with bright ears, a friendly grin, and playful laptop-working poses.",category:"\u52A8\u7269\u4F19\u4F34",author:"cxian0928-afk",authorHandle:"cxian0928-afk",kind:"pet",atlas:"assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.webp",thumbnail:"assets/pets/upstream-20261009/corgi-companion--cxian0928-afk-thumb.webp",version:1,tags:["corgi","dog","orange","cute","laptop","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/corgi-companion--cxian0928-afk",license:"MIT License",download:"assets/pets/upstream-20261009/corgi-companion--cxian0928-afk.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/corgi-companion--cxian0928-afk",spritesheetSha256:"7ce091d553f8c52608c80f0d61a602cd50f13459d912e1c9a9862694a77fec40",metadataNameAlias:!1,authorUrl:"https://github.com/cxian0928-afk"},{id:"crt-monitor--wxy",title:"CRT \u663E\u793A\u5668",englishTitle:"CRT Monitor",description:"A tiny retro CRT monitor that keeps an eye on your code.",category:"\u673A\u5668\u4EBA",author:"wxy",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/crt-monitor--wxy.webp",thumbnail:"assets/pets/upstream-20261009/crt-monitor--wxy-thumb.webp",version:2,tags:["robot","retro-computing","crt","coding"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/crt-monitor--wxy",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/crt-monitor--wxy.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/crt-monitor--wxy",spritesheetSha256:"4027e21fb235f5bc5eb992e711531dfb2ac3641eeb1056e21e338c1b28806970",metadataNameAlias:!1},{id:"cyrene--lingxiaotian",title:"\u6614\u6D9F",englishTitle:"Cyrene",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u6614\u6D9F\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7C89\u767D\u957F\u53D1\u3001\u767D\u7C89\u84DD\u793C\u88D9\u3001\u7FBD\u53F6\u72B6\u5934\u9970\u4E0E\u8F7B\u76C8\u68A6\u5E7B\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/cyrene--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/cyrene--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","cyrene","pink","dreamy"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/cyrene--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/cyrene--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/cyrene--lingxiaotian",spritesheetSha256:"451b409ab66cc60ab1e7f06136a0cb8c76dbb147816c779d57675912becb36b0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"desk-otter--zihualiu1997",title:"Desk Otter",englishTitle:"Desk Otter",description:"A bespectacled desk-worker otter mascot in a blue shirt, animated for Codex task states.",category:"\u52A8\u7269\u4F19\u4F34",author:"zihualiu1997",authorHandle:"zihualiu1997",kind:"pet",atlas:"assets/pets/upstream-20261009/desk-otter--zihualiu1997.webp",thumbnail:"assets/pets/upstream-20261009/desk-otter--zihualiu1997-thumb.webp",version:1,tags:["otter","desk-worker","glasses","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/desk-otter--zihualiu1997",license:"MIT License",download:"assets/pets/upstream-20261009/desk-otter--zihualiu1997.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/desk-otter--zihualiu1997",spritesheetSha256:"e48f36365aab834bcd8f6fd21a21727eced21fb1ff2940bf5e5980bebe85e18e",metadataNameAlias:!1,authorUrl:"https://github.com/zihualiu1997"},{id:"diandian--lllucasxu",title:"Diandian",englishTitle:"Diandian",description:"A calm tabby-and-white cat companion with a sleepy face and gentle curled-up poses.",category:"\u52A8\u7269\u4F19\u4F34",author:"LLLucasXU",authorHandle:"LLLucasXU",kind:"pet",atlas:"assets/pets/upstream-20261009/diandian--lllucasxu.webp",thumbnail:"assets/pets/upstream-20261009/diandian--lllucasxu-thumb.webp",version:1,tags:["cat","tabby","sleepy","calm","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diandian--lllucasxu",license:"MIT License",download:"assets/pets/upstream-20261009/diandian--lllucasxu.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/diandian--lllucasxu",spritesheetSha256:"276cd3263e708dd43ca03919305dd75827b99d0d9012e70a8cf5b4be502714d4",metadataNameAlias:!1,authorUrl:"https://github.com/LLLucasXU"},{id:"diaoyi-baobao--d1a0y1bb",title:"Diaoyi Baobao",englishTitle:"Diaoyi Baobao",description:"A tiny green clover-like companion with a round face and gentle, cheerful expressions.",category:"\u5409\u7965\u7269",author:"D1a0y1bb",authorHandle:"D1a0y1bb",kind:"pet",atlas:"assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.webp",thumbnail:"assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb-thumb.webp",version:1,tags:["clover","green","mascot","cute","round","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/diaoyi-baobao--d1a0y1bb",license:"MIT License",download:"assets/pets/upstream-20261009/diaoyi-baobao--d1a0y1bb.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/diaoyi-baobao--d1a0y1bb",spritesheetSha256:"585e5c3f39021699d7671a450d9e9b77f1f73d0099560fcbdbed2e457a917bc6",metadataNameAlias:!1,authorUrl:"https://github.com/D1a0y1bb"},{id:"doro--lingxiaotian",title:"\u6843\u4E50\u4E1D\uFF08Doro\uFF09",englishTitle:"Doro",description:"A compact Codex digital pet inspired by Doro, the vacant pink-haired Dorothy meme creature from Goddess of Victory: NIKKE.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/doro--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/doro--lingxiaotian-thumb.webp",version:1,tags:["anime","nikke","doro","dorothy","meme","pink-hair"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/doro--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/doro--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["nikke"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/doro--lingxiaotian",spritesheetSha256:"f0661f6f0b1297e54d40a33f0ecfa5c8ef76c88d5b92c4edd7dd76e9ca99872c",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"evanescia-lunar-blossoming--jasdfgh",title:"\u7EEF\u82F1 \xB7 \u6708\u5F85\u82B1\u65F6",englishTitle:"Evanescia \xB7 Lunar Blossoming",description:"\u6C89\u8FF7\u6F2B\u753B\u7684\u8BFB\u8005\uFF0C\u70ED\u8877\u796D\u5178\u7684\u6E38\u5BA2  \uFF0C\u4EA6\u662F\u5E7B\u6708\u6E38\u620F\u7684\u5B88\u62A4\u8005\u3002\u7EEF\u82F1\u6362\u4E0A\u300C\u6708\u5F85\u82B1\u65F6\u300D\uFF0C\u7B11\u91CC\u85CF\u4E09\u5206\u72E1\u9EE0\uFF0C\u8170\u95F4\u60AC\u4E00\u67C4\u5C3A\u5203\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"Jasdfgh",authorHandle:"Jasdfgh",kind:"pet",atlas:"assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.webp",thumbnail:"assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh-thumb.webp",version:2,tags:["honkai-star-rail","anime","chibi","pink"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/evanescia-lunar-blossoming--jasdfgh",license:"CC BY-NC 4.0 for the submitter's licensable contributions; non-commercial use only. Original Honkai: Star Rail / HoYoverse character, outfit, and other third-party intellectual property are excluded. Unofficial fan art; no official affiliation or endorsement.",download:"assets/pets/upstream-20261009/evanescia-lunar-blossoming--jasdfgh.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/evanescia-lunar-blossoming--jasdfgh",spritesheetSha256:"b3ffe93e45b846fce1559471f66cb5328994ea6a4c7f72fbb0cc91914a68a072",metadataNameAlias:!1,authorUrl:"https://github.com/Jasdfgh"},{id:"feixiao--lingxiaotian",title:"\u98DE\u9704",englishTitle:"Feixiao",description:"\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u98DE\u9704\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u5C06\u519B\u8F6E\u5ED3\u3001\u9752\u767D\u914D\u8272\u3001\u5229\u843D\u8FD0\u52A8\u59FF\u6001\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/feixiao--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/feixiao--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","feixiao","teal","general"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/feixiao--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/feixiao--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/feixiao--lingxiaotian",spritesheetSha256:"7ad0f3f3561e8056b195b11e95090fb228b9bcb0fb3958725ce1380d4353f7e1",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"fleta--natewanggg",title:"Fleta",englishTitle:"Fleta",description:"A cute pixel-art-adjacent Codex pet based on Fleta, a plush silver-white cat with round cheeks, big blue-gray eyes, tiny paws, and soft gray shading.",category:"\u52A8\u7269\u4F19\u4F34",author:"NateWanggg",authorHandle:"NateWanggg",kind:"pet",atlas:"assets/pets/upstream-20261009/fleta--natewanggg.webp",thumbnail:"assets/pets/upstream-20261009/fleta--natewanggg-thumb.webp",version:1,tags:["cat","silver-white","fleta","original-pet","soft"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/fleta--natewanggg",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/fleta--natewanggg.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/fleta--natewanggg",spritesheetSha256:"e50eaf9d33e425fee880de1a7715606a729f478ca926def0ead5f3e8240e3a2d",metadataNameAlias:!1,authorUrl:"https://github.com/NateWanggg"},{id:"frankie--aygunvarol",title:"Frankie",englishTitle:"Frankie",description:"A cute sausage dog companion with a long dachshund body, floppy ears, and bright friendly eyes.",category:"\u52A8\u7269\u4F19\u4F34",author:"Aygun Varol",authorHandle:"AygunVarol",kind:"pet",atlas:"assets/pets/upstream-20261009/frankie--aygunvarol.webp",thumbnail:"assets/pets/upstream-20261009/frankie--aygunvarol-thumb.webp",version:1,tags:["dachshund","dog","sausage-dog","cute","brown","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frankie--aygunvarol",license:"MIT License",download:"assets/pets/upstream-20261009/frankie--aygunvarol.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/frankie--aygunvarol",spritesheetSha256:"93d4bd6c9cb42ca7a18a71cbe2ee3587a2a8973f41a8d65e760f1328879e8aa1",metadataNameAlias:!1,authorUrl:"https://github.com/AygunVarol"},{id:"frieren--lingxiaotian",title:"\u8299\u8389\u83B2",englishTitle:"Frieren",description:"A compact Codex digital pet inspired by Frieren, a calm elven mage companion.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/frieren--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/frieren--lingxiaotian-thumb.webp",version:1,tags:["anime","elf","mage","fantasy","frieren"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/frieren--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/frieren--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["frieren"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/frieren--lingxiaotian",spritesheetSha256:"539f740b954e499ffd56f837cfe0afe4a522e56fe9c9dde134f50b7252a4a7b9",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"furina--lingxiaotian",title:"\u8299\u5B81\u5A1C",englishTitle:"Furina",description:"\u300A\u539F\u795E\u300B\u8299\u5B81\u5A1C\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u84DD\u767D\u793C\u5E3D\u3001\u821E\u53F0\u611F\u548C\u4FCF\u76AE\u620F\u5267\u8868\u60C5\u3002.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/furina--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/furina--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","furina","fontaine","theatrical"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/furina--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/furina--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/furina--lingxiaotian",spritesheetSha256:"91cb4fbb0dc747783e83cb6d09e58476c6adc7d53dd8294c1d609e975c93b99a",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"golden-lamp--legeling",title:"Golden Lamp",englishTitle:"Golden Lamp",description:"An AI-generated golden-lamp sprite based on the reference supplied in request #149. Sprite-only lamp interpretation; the intended request subject and remaining request scope are unresolved pending requester confirmation.",category:"\u5176\u4ED6",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/golden-lamp--legeling.webp",thumbnail:"assets/pets/upstream-20261009/golden-lamp--legeling-thumb.webp",version:2,tags:["gold-lamp","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/golden-lamp--legeling",license:"CC BY-NC 4.0. Non-commercial use only; commercial use is prohibited. Rights in the requester-supplied reference image and any depicted or referenced characters remain with their respective rights holders. This is an unofficial AI-generated community interpretation.",download:"assets/pets/upstream-20261009/golden-lamp--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/golden-lamp--legeling",spritesheetSha256:"bad38befd0eaccf0ce9f96adfc08eced1a1cd9d865317dffbdc40efb51539024",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"hajimi--zeyuwang1999",title:"Hajimi",englishTitle:"Hajimi",description:"A cute purple-haired cat-eared companion with soft expressions and Codex-optimized desktop-pet animations.",category:"\u539F\u521B\u89D2\u8272",author:"zeyu.wang",authorHandle:"zeyuwang1999",kind:"pet",atlas:"assets/pets/upstream-20261009/hajimi--zeyuwang1999.webp",thumbnail:"assets/pets/upstream-20261009/hajimi--zeyuwang1999-thumb.webp",version:1,tags:["hajimi","cat-ears","purple","cute","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hajimi--zeyuwang1999",license:"MIT License",download:"assets/pets/upstream-20261009/hajimi--zeyuwang1999.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hajimi--zeyuwang1999",spritesheetSha256:"0a203ff15f0cdd503b54743c5d27c4d67c355c2359f91ceedacf449493e11a4f",metadataNameAlias:!1,authorUrl:"https://github.com/zeyuwang1999"},{id:"hana2--initiatione",title:"Hana2",englishTitle:"Hana2",description:"A refined kimono-style Hana pixel pet with gentle expressions, floral details, and calm desktop-pet animations.",category:"\u539F\u521B\u89D2\u8272",author:"initiatione",authorHandle:"initiatione",kind:"pet",atlas:"assets/pets/upstream-20261009/hana2--initiatione.webp",thumbnail:"assets/pets/upstream-20261009/hana2--initiatione-thumb.webp",version:1,tags:["hana","kimono","pixel-art","gentle","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hana2--initiatione",license:"MIT License",download:"assets/pets/upstream-20261009/hana2--initiatione.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hana2--initiatione",spritesheetSha256:"ddbc017778f7824709cc0b9d2774022c18486b4449f47073891e406b2e5712af",metadataNameAlias:!1,authorUrl:"https://github.com/initiatione"},{id:"hu-tao--lingxiaotian",title:"\u80E1\u6843",englishTitle:"Hu Tao",description:"\u300A\u539F\u795E\u300B\u80E1\u6843\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u5F80\u751F\u5802\u5E3D\u5B50\u3001\u6885\u82B1\u773C\u4E0E\u4FCF\u76AE\u7075\u52A8\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/hu-tao--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/hu-tao--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","hu-tao","black-red","playful"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hu-tao--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/hu-tao--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hu-tao--lingxiaotian",spritesheetSha256:"9dc7651a1d8b7074ff9d506ef57059805b6c3e23d15841dc54199292c7fce183",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"iris--yau-427",title:"Iris",englishTitle:"Iris",description:"A cheerful manga-pop companion who works at her laptop inside a chunky neon terminal window.",category:"\u539F\u521B\u89D2\u8272",author:"Yau-427",authorHandle:"Yau-427",kind:"pet",atlas:"assets/pets/upstream-20261009/iris--yau-427.webp",thumbnail:"assets/pets/upstream-20261009/iris--yau-427-thumb.webp",version:2,tags:["anime","manga-pop","cyberpunk","neon","coding","terminal","coffee","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iris--yau-427",license:"MIT License; original AI-assisted artwork submitted by Yau-427 with redistribution permission.",download:"assets/pets/upstream-20261009/iris--yau-427.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/iris--yau-427",spritesheetSha256:"9549db84e558ecc3477853c95b81a84f50447ccd32566ff5cf22520f2785b9da",metadataNameAlias:!1,authorUrl:"https://github.com/Yau-427"},{id:"isekaijoucho--siiverash",title:"Isekaijoucho",englishTitle:"Isekaijoucho",description:"An Isekaijoucho-inspired fan-art Codex pet with long wavy silver hair, a vivid blue flower ornament, a white-and-ice-blue dress palette, and a compact chibi pixel sprite identity.",category:"\u52A8\u6F2B\u89D2\u8272",author:"SiIverAsh",authorHandle:"SiIverAsh",kind:"pet",atlas:"assets/pets/upstream-20261009/isekaijoucho--siiverash.webp",thumbnail:"assets/pets/upstream-20261009/isekaijoucho--siiverash-thumb.webp",version:1,tags:["kamitsubaki-studio","isekaijoucho","virtual-singer","pixel-art","hatch-pet"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/isekaijoucho--siiverash",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/isekaijoucho--siiverash.zip",date:"",importedAt:"2026-10-09",collections:["kamitsubaki-studio"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/isekaijoucho--siiverash",spritesheetSha256:"6863ba09b86a8a8f50bdf90e07ac149ea0c9269c1e2e6323b60d29dfd58cb2a1",metadataNameAlias:!1,authorUrl:"https://github.com/SiIverAsh"},{id:"joker--oytyo",title:"Joker",englishTitle:"Joker",description:"A pixel-art theatrical card trickster in a tailored purple-black suit with green-black hair, painted eyes, playing-card animations, and 16-way looking directions.",category:"\u539F\u521B\u89D2\u8272",author:"oYTYo",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/joker--oytyo.webp",thumbnail:"assets/pets/upstream-20261009/joker--oytyo-thumb.webp",version:2,tags:["pixel-art","card-trickster","theatrical","playing-cards"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/joker--oytyo",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/joker--oytyo.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/joker--oytyo",spritesheetSha256:"39b74779641dd5cbe1947ee1f1463c8fbeffc66e8793c014696bbe67935f1cef",metadataNameAlias:!1},{id:"kamisato-ayaka--lingxiaotian",title:"\u795E\u91CC\u7EEB\u534E",englishTitle:"Kamisato Ayaka",description:"\u300A\u539F\u795E\u300B\u795E\u91CC\u7EEB\u534E\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u84DD\u767D\u914D\u8272\u3001\u516C\u4E3B\u5207\u8F6E\u5ED3\u4E0E\u5B89\u9759\u4F18\u96C5\u7684\u7A3B\u59BB\u5927\u5C0F\u59D0\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","kamisato-ayaka","cryo","blue"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kamisato-ayaka--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/kamisato-ayaka--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/kamisato-ayaka--lingxiaotian",spritesheetSha256:"2e4a779f8a1d8c8ab4199d4ccf4f0f609bd1307323bfea7005bf5b73fe259f58",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"katana-cheems--thankyou-cheems",title:"Katana Cheems",englishTitle:"Katana Cheems",description:"A pixel-art Cheems pet wearing a straw hat, carrying a tiny katana, and crying a blue meme tear when a Codex task fails.",category:"\u7F51\u7EDC\u6897\u56FE",author:"Thankyou-Cheems",authorHandle:"Thankyou-Cheems",kind:"pet",atlas:"assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.webp",thumbnail:"assets/pets/upstream-20261009/katana-cheems--thankyou-cheems-thumb.webp",version:1,tags:["cheems","dog","shiba","katana","straw-hat","pixel-art","meme","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/katana-cheems--thankyou-cheems",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/katana-cheems--thankyou-cheems.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/katana-cheems--thankyou-cheems",spritesheetSha256:"467ada74e238f6b27b85a010e6825eb0e3e8dd864d9f0143849e60301bd9498e",metadataNameAlias:!1,authorUrl:"https://github.com/Thankyou-Cheems"},{id:"kiko--untko",title:"Kiko",englishTitle:"Kiko",description:"A cheerful color-changing gecko companion with expressive animations and curious eyes.",category:"\u52A8\u7269\u4F19\u4F34",author:"untko",authorHandle:"untko",kind:"pet",atlas:"assets/pets/upstream-20261009/kiko--untko.webp",thumbnail:"assets/pets/upstream-20261009/kiko--untko-thumb.webp",version:2,tags:["gecko","animal","3d-toy","color-changing","expressive","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kiko--untko",license:"CC BY-NC 4.0. The creator owns or controls the Kiko artwork and authorizes its redistribution and modification under CC BY-NC 4.0, without warranty.",download:"assets/pets/upstream-20261009/kiko--untko.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/kiko--untko",spritesheetSha256:"dadeab52face9c15e29a9e5e28ae3860b9634ebf4ce7aca42b59c484bd6f3a2f",metadataNameAlias:!1,authorUrl:"https://github.com/untko"},{id:"kurimanju--legeling",title:"\u6817\u5B50\u9992\u5934",englishTitle:"Kurimanju",description:"The flushed brown-crowned Chiikawa character with four blush strokes on each cheek.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/kurimanju--legeling.webp",thumbnail:"assets/pets/upstream-20261009/kurimanju--legeling-thumb.webp",version:2,tags:["community-request","chiikawa","kurimanju"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/kurimanju--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/kurimanju--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/kurimanju--legeling",spritesheetSha256:"aeba2fd4e4e9290c8f794decf68563176bef816e313d0cafc6e30c6ef1122cb2",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"lil-swole--gg0805",title:"Lil Swole",englishTitle:"Lil Swole",description:"A cultured, gloriously brainrotted gym-rat icon who curls a computer mouse while his parrot wingman launches dumbbells.",category:"\u52A8\u7269\u4F19\u4F34",author:"gg0805",authorHandle:"gg0805",kind:"pet",atlas:"assets/pets/upstream-20261009/lil-swole--gg0805.webp",thumbnail:"assets/pets/upstream-20261009/lil-swole--gg0805-thumb.webp",version:2,tags:["rat","gym","streetwear","parrot","sticker","original","codex-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lil-swole--gg0805",license:"CC BY-NC 4.0. Original AI-generated artwork created for and submitted by gg0805; no third-party source assets were used.",download:"assets/pets/upstream-20261009/lil-swole--gg0805.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/lil-swole--gg0805",spritesheetSha256:"3ef92b0f66ab097c75b2e9f5bb03c299c4140e20fe0802228f2c5f3fd2bcf810",metadataNameAlias:!1,authorUrl:"https://github.com/gg0805"},{id:"little-sheep--mingdong",title:"Little Sheep",englishTitle:"Little Sheep",description:"A fluffy cream sheep with wine-red horns, made as a cozy Codex companion that grazes, waits, and trots in tiny loops.",category:"\u52A8\u7269\u4F19\u4F34",author:"MingDong",authorHandle:"MingDong",kind:"pet",atlas:"assets/pets/upstream-20261009/little-sheep--mingdong.webp",thumbnail:"assets/pets/upstream-20261009/little-sheep--mingdong-thumb.webp",version:1,tags:["sheep","animal","fluffy","wine-red-horns","cozy"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-sheep--mingdong",license:"CC BY-NC 4.0. Original AI-assisted asset created by MingDong for Codex pet submission; no third-party source asset.",download:"assets/pets/upstream-20261009/little-sheep--mingdong.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/little-sheep--mingdong",spritesheetSha256:"af80e8c26246720152ce425c44b3e10606df56351477e916044103832a0248b3",metadataNameAlias:!1},{id:"lulu--yogazz",title:"Lulu",englishTitle:"Lulu",description:"A cheerful rounded yellow-orange 3D toy companion for Codex.",category:"\u5409\u7965\u7269",author:"YoGazz",authorHandle:"YoGazz",kind:"pet",atlas:"assets/pets/upstream-20261009/lulu--yogazz.webp",thumbnail:"assets/pets/upstream-20261009/lulu--yogazz-thumb.webp",version:1,tags:["original","3d-toy","yellow-orange","codex-pet"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/lulu--yogazz",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/lulu--yogazz.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/lulu--yogazz",spritesheetSha256:"459bf8ce95e855331bdd81de48b8466a46a1df72e6fdef45a77213eda89373a3",metadataNameAlias:!1,authorUrl:"https://github.com/YoGazz"},{id:"mahiro--lingxiaotian",title:"\u7EEA\u5C71\u771F\u5BFB",englishTitle:"Mahiro",description:"A shy Codex digital pet inspired by Mahiro Oyama from ONIMAI, wearing an oversized off-shoulder summer shirt.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/mahiro--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/mahiro--lingxiaotian-thumb.webp",version:1,tags:["anime","onimai","mahiro","oyama-mahiro","off-shoulder"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mahiro--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/mahiro--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["onimai"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mahiro--lingxiaotian",spritesheetSha256:"a9222f3db52ff004814e12897baee2c2b86240749526de45ec418c21125156ec",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"mai--dwdestiny",title:"Mai",englishTitle:"Mai",description:"A cool and fluffy white bichon-style puppy boss with round sunglasses, an orange bow tie, and playful work animations.",category:"\u52A8\u7269\u4F19\u4F34",author:"DwDestiny",authorHandle:"DwDestiny",kind:"pet",atlas:"assets/pets/upstream-20261009/mai--dwdestiny.webp",thumbnail:"assets/pets/upstream-20261009/mai--dwdestiny-thumb.webp",version:1,tags:["dog","bichon","puppy","sunglasses","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mai--dwdestiny",license:"MIT License",download:"assets/pets/upstream-20261009/mai--dwdestiny.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mai--dwdestiny",spritesheetSha256:"dde0f307bd046cd5f9bd72103bfcac22c4b2f892a002e6bad545aa5132ebc697",metadataNameAlias:!1,authorUrl:"https://github.com/DwDestiny"},{id:"mihari--hyoni1129",title:"Mihari",englishTitle:"Mihari",description:"Unofficial fan-made Codex pet inspired by Mihari Oyama from ONIMAI, adapted as a tiny caring chibi pixel-art lab assistant with smoother directional motion, notebook task-processing, and clipboard review states.",category:"\u52A8\u6F2B\u89D2\u8272",author:"Jeonghan Lee (@Hyoni1129)",authorHandle:"Hyoni1129",kind:"pet",atlas:"assets/pets/upstream-20261009/mihari--hyoni1129.webp",thumbnail:"assets/pets/upstream-20261009/mihari--hyoni1129-thumb.webp",version:1,tags:["anime","onimai","mihari","scientist","lab-coat","fan-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mihari--hyoni1129",license:"CC BY-NC 4.0; unofficial fan-made non-commercial pet; no official ONIMAI artwork, screenshots, logos, or source assets are included; underlying character rights belong to their respective rights holders.",download:"assets/pets/upstream-20261009/mihari--hyoni1129.zip",date:"",importedAt:"2026-10-09",collections:["onimai"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mihari--hyoni1129",spritesheetSha256:"edc0709882db81345f6365eec499cdef9f67cb76876284228f367c662ff69e68",metadataNameAlias:!1,authorUrl:"https://github.com/Hyoni1129"},{id:"mika--rotl24",title:"Mika",englishTitle:"Mika",description:"A cozy long-haired chibi companion in headphones, scarf, and school-style winter clothes.",category:"\u539F\u521B\u89D2\u8272",author:"ROTl24",authorHandle:"ROTl24",kind:"pet",atlas:"assets/pets/upstream-20261009/mika--rotl24.webp",thumbnail:"assets/pets/upstream-20261009/mika--rotl24-thumb.webp",version:1,tags:["mika","chibi","headphones","winter","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mika--rotl24",license:"MIT License",download:"assets/pets/upstream-20261009/mika--rotl24.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mika--rotl24",spritesheetSha256:"5b0f19306e0a4d12393875004bf700dd5cf35d59a1d3c14bc31cc4a8062e2f9c",metadataNameAlias:!1,authorUrl:"https://github.com/ROTl24"},{id:"mikoto--lingxiaotian",title:"\u5FA1\u5742\u7F8E\u7434",englishTitle:"Mikoto",description:"A chibi electric schoolgirl Codex pet with coin tricks inspired by Misaka Mikoto.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/mikoto--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/mikoto--lingxiaotian-thumb.webp",version:1,tags:["anime","a-certain-scientific-railgun","electric","schoolgirl","misaka-mikoto"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mikoto--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/mikoto--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["a-certain-scientific-railgun"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mikoto--lingxiaotian",spritesheetSha256:"1765adf93fd65916a6f1cae8670d8df0afa30231fc8214999c98ebefb0a4c5c2",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"miku--lingxiaotian",title:"\u521D\u97F3\u672A\u6765",englishTitle:"Miku",description:"A compact Codex digital pet inspired by Hatsune Miku, a bright virtual idol singer.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/miku--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/miku--lingxiaotian-thumb.webp",version:1,tags:["anime","virtual-idol","teal-hair","twintails","miku"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/miku--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/miku--lingxiaotian",spritesheetSha256:"6212ca761be1278b1dbcba214e2c8a0f637f0b526eb4e3692994f74e750e502c",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"mimi--spacebody",title:"Mimi",englishTitle:"Mimi",description:"A silver tabby American Shorthair kitten companion with bright green eyes and playful desktop-pet motions.",category:"\u52A8\u7269\u4F19\u4F34",author:"Jerry",authorHandle:"Spacebody",kind:"pet",atlas:"assets/pets/upstream-20261009/mimi--spacebody.webp",thumbnail:"assets/pets/upstream-20261009/mimi--spacebody-thumb.webp",version:1,tags:["cat","kitten","tabby","cute","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/mimi--spacebody",license:"MIT License",download:"assets/pets/upstream-20261009/mimi--spacebody.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/mimi--spacebody",spritesheetSha256:"f8acfb98b864a717a5876fc7a4ce696b2bced4998c62b913b4ddec30721760a0",metadataNameAlias:!1,authorUrl:"https://github.com/Spacebody"},{id:"minty--somnusochi",title:"Minty",englishTitle:"Minty",description:"A mint-haired animated companion with nine activity animations and sixteen v2 look directions.",category:"\u539F\u521B\u89D2\u8272",author:"Somnusochi",authorHandle:"Somnusochi",kind:"pet",atlas:"assets/pets/upstream-20261009/minty--somnusochi.webp",thumbnail:"assets/pets/upstream-20261009/minty--somnusochi-thumb.webp",version:2,tags:["mint","anime","look-directions","pixel-art","codex-v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/minty--somnusochi",license:"MIT License",download:"assets/pets/upstream-20261009/minty--somnusochi.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/minty--somnusochi",spritesheetSha256:"f50fa768ae82a9874a9429174d0dc69f35ff0937f827a1f5805317ca3a6f4d89",metadataNameAlias:!1,authorUrl:"https://github.com/Somnusochi"},{id:"misaka-network--ldl1234",title:"\u5FA1\u5742\u7F51\u7EDC",englishTitle:"Misaka Network",description:"\u5FA1\u5742\u7F51\u7EDC\u98CE\u683C\u7684 v2 Codex \u50CF\u7D20\u5BA0\u7269\uFF0C\u7A7F\u7C73\u8272\u6821\u670D\u5916\u5957\u3001\u7EA2\u9886\u7ED3\u4E0E\u84DD\u7070\u683C\u88D9\uFF0C\u4FDD\u7559\u9ED1\u732B\u3001\u673A\u68B0\u88C5\u5907\u3001\u7535\u6D41\u548C\u5DE8\u5927\u98CE\u673A\u6548\u679C\uFF0C\u5E76\u652F\u6301 16 \u4E2A\u73AF\u89C6\u65B9\u5411\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"LyuDonglian",authorHandle:"ldl1234",kind:"pet",atlas:"assets/pets/upstream-20261009/misaka-network--ldl1234.webp",thumbnail:"assets/pets/upstream-20261009/misaka-network--ldl1234-thumb.webp",version:2,tags:["anime","a-certain-scientific-railgun","electric","schoolgirl","misaka-network","pixel-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/misaka-network--ldl1234",license:"MIT",download:"assets/pets/upstream-20261009/misaka-network--ldl1234.zip",date:"",importedAt:"2026-10-09",collections:["a-certain-scientific-railgun"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/misaka-network--ldl1234",spritesheetSha256:"18f63c26660ab453cf0f575c9c8c3a82b125121adb53821602bb1884ab4ef44b",metadataNameAlias:!1,authorUrl:"https://github.com/ldl1234"},{id:"missile--zpzjzj",title:"Missile",englishTitle:"Missile",description:"An energetic orange Pomeranian inspired by Ghost Trick's loyal Missile, with a huge cream ruff, curled plume tail, and joyful expression.",category:"\u6E38\u620F\u89D2\u8272",author:"Ping",authorHandle:"zpzjzj",kind:"pet",atlas:"assets/pets/upstream-20261009/missile--zpzjzj.webp",thumbnail:"assets/pets/upstream-20261009/missile--zpzjzj-thumb.webp",version:2,tags:["ghost-trick","missile","dog","pomeranian","flat-vector"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/missile--zpzjzj",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/missile--zpzjzj.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/missile--zpzjzj",spritesheetSha256:"007969983fc73bb30e601713e61bc25bf78f3590b5ae432f755d39d3efc619cb",metadataNameAlias:!1,authorUrl:"https://github.com/zpzjzj"},{id:"my-little-orange-cat--zhou-jianwen",title:"My Little Orange Cat",englishTitle:"My Little Orange Cat",description:"A softly illustrated orange-and-white cat inspired by community request #179.",category:"\u5176\u4ED6",author:"zhou-jianwen",authorHandle:"zhou-jianwen",kind:"pet",atlas:"assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.webp",thumbnail:"assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen-thumb.webp",version:2,tags:["cat","community-request"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/my-little-orange-cat--zhou-jianwen",license:"Non-commercial use and redistribution only, with credit to zhou-jianwen for this AI-assisted pet contribution. Commercial use is prohibited. No ownership or license over the submitted reference photograph is asserted or granted.",download:"assets/pets/upstream-20261009/my-little-orange-cat--zhou-jianwen.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/my-little-orange-cat--zhou-jianwen",spritesheetSha256:"90f70801768beef9a0d9d66a28371c0e9e7635b40eed27d96fd6427c56975ec4",metadataNameAlias:!1,authorUrl:"https://github.com/zhou-jianwen"},{id:"nahida--lingxiaotian",title:"\u7EB3\u897F\u59B2",englishTitle:"Nahida",description:"\u300A\u539F\u795E\u300B\u7EB3\u897F\u59B2\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u767D\u7EFF\u914D\u8272\u3001\u53F6\u9970\u8F6E\u5ED3\u4E0E\u8F7B\u76C8\u6E29\u67D4\u7684\u68EE\u6797\u7CBE\u7075\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/nahida--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/nahida--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","nahida","dendro","green"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nahida--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/nahida--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/nahida--lingxiaotian",spritesheetSha256:"ee20f2d7996c296be86895af0413e02adfaf81705ff6373927cab39d394b8ebb",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"navia--lingxiaotian",title:"\u5A1C\u7EF4\u5A05",englishTitle:"Navia",description:"\u300A\u539F\u795E\u300B\u5A1C\u7EF4\u5A05\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9EC4\u9ED1\u793C\u670D\u3001\u5BBD\u6A90\u5E3D\u4E0E\u660E\u4EAE\u5927\u5C0F\u59D0\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/navia--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/navia--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","navia","gold","elegant"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/navia--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/navia--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/navia--lingxiaotian",spritesheetSha256:"daf0ad82f6ebd07e32e6a6833e6a7eb2465520cf05080959d66d8db624955052",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"night-neko--netizenxuan",title:"Night Neko",englishTitle:"Night Neko",description:"A white cat-demon desktop companion with sleepy eyes, red-black bat wings, gothic stripes, one fluffy tail, and late-night coding energy.",category:"\u5E7B\u60F3\u751F\u7269",author:"netizenXuan",authorHandle:"netizenXuan",kind:"pet",atlas:"assets/pets/upstream-20261009/night-neko--netizenxuan.webp",thumbnail:"assets/pets/upstream-20261009/night-neko--netizenxuan-thumb.webp",version:1,tags:["cat","demon","gothic","night","coding","cyberpunk","chibi"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/night-neko--netizenxuan",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/night-neko--netizenxuan.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/night-neko--netizenxuan",spritesheetSha256:"0762cd9a14129b765a030fe5a35785faa2d6e466fb080a7607e42a6bd765c4a2",metadataNameAlias:!1,authorUrl:"https://github.com/netizenXuan"},{id:"niu-lai--wynn",title:"Niu Lai",englishTitle:"Niu Lai",description:"An unofficial, AI-generated Niu Lai fan-art calf companion, patient during approvals and curious during research.",category:"\u52A8\u6F2B\u89D2\u8272",author:"wynn",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/niu-lai--wynn.webp",thumbnail:"assets/pets/upstream-20261009/niu-lai--wynn-thumb.webp",version:2,tags:["fan-art","3d","ai-generated","orange","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niu-lai--wynn",license:"Non-commercial use and redistribution only, with credit to wynn, to the extent wynn holds rights in this contribution. The underlying Niu Lai film character and reference imagery remain subject to third-party rights; no permission from their rightsholders is asserted or granted. Unofficial fan art; no affiliation or endorsement. These terms do not establish third-party rights clearance.",download:"assets/pets/upstream-20261009/niu-lai--wynn.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/niu-lai--wynn",spritesheetSha256:"75b1809e88d6e4bebcb040f9a3dcffdb1eed1964dd86366527bb95ea7d26b575",metadataNameAlias:!1,authorUrl:"https://github.com/zhou-jianwen"},{id:"paimon--lingxiaotian",title:"\u6D3E\u8499",englishTitle:"Paimon",description:"A compact Codex digital pet inspired by Paimon, the floating companion from Genshin Impact.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/paimon--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/paimon--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","paimon","floating-companion","white-hair"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/paimon--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/paimon--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/paimon--lingxiaotian",spritesheetSha256:"489946a931de1f561c50d2e6941c82707d5703b6073b5169b6bc5c607459aea6",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"panda--jason-bai",title:"Panda",englishTitle:"Panda",description:"A soft, healing panda companion with round eyes, tiny paws, and gentle calming poses.",category:"\u52A8\u7269\u4F19\u4F34",author:"Jason Bai",authorHandle:"Jason-Bai",kind:"pet",atlas:"assets/pets/upstream-20261009/panda--jason-bai.webp",thumbnail:"assets/pets/upstream-20261009/panda--jason-bai-thumb.webp",version:1,tags:["panda","soft","healing","cute","gentle","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/panda--jason-bai",license:"MIT License",download:"assets/pets/upstream-20261009/panda--jason-bai.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/panda--jason-bai",spritesheetSha256:"a7c9d21f98af24566daa8fbbd67b65e6b48572eec885165d7b86c5a4311fb325",metadataNameAlias:!1,authorUrl:"https://github.com/Jason-Bai"},{id:"pixel-duck--flamurmaliqi",title:"Pixel Duck",englishTitle:"Pixel Duck",description:"An original pixel duck that spins through the same eight-frame loop in every Codex state.",category:"\u52A8\u7269\u4F19\u4F34",author:"Flamur Maliqi",authorHandle:"FlamurMaliqi",kind:"pet",atlas:"assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.webp",thumbnail:"assets/pets/upstream-20261009/pixel-duck--flamurmaliqi-thumb.webp",version:1,tags:["duck","pixel-art","spin","codex-pets"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/pixel-duck--flamurmaliqi",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/pixel-duck--flamurmaliqi.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/pixel-duck--flamurmaliqi",spritesheetSha256:"88ca26717528fe1d01fcba2a649cc5633e40ea886e3b028ffab25654787a87da",metadataNameAlias:!1,authorUrl:"https://github.com/FlamurMaliqi"},{id:"potato--legeling",title:"Potato",englishTitle:"Potato",description:"A plain ochre pixel potato with a stepped outline and gentle organic movements.",category:"\u7269\u4EF6\u4E0E\u9053\u5177",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/potato--legeling.webp",thumbnail:"assets/pets/upstream-20261009/potato--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/potato--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/potato--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/potato--legeling",spritesheetSha256:"48531925a56a4808f822cccfe6b6e91ec0a4bdc0c70f5270d935e98f273c5d98",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"raiden-shogun--lingxiaotian",title:"\u96F7\u7535\u5C06\u519B",englishTitle:"Raiden Shogun",description:"\u300A\u539F\u795E\u300B\u96F7\u7535\u5C06\u519B\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u8272\u957F\u53D1\u3001\u7535\u5143\u7D20\u7D2B\u5149\u70B9\u7F00\u3001\u548C\u98CE\u670D\u9970\u8F6E\u5ED3\u4E0E\u5A01\u4E25\u51B7\u9759\u7684\u795E\u660E\u6C14\u8D28\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/raiden-shogun--lingxiaotian-thumb.webp",version:1,tags:["anime","genshin-impact","raiden-shogun","electro","purple"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/raiden-shogun--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/raiden-shogun--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/raiden-shogun--lingxiaotian",spritesheetSha256:"5eed45f5082a086facf960007b8cc1fab00abe01c1ebc2fdd1a6dd2e418e8ca4",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"reimu--lingxiaotian",title:"\u535A\u4E3D\u7075\u68A6",englishTitle:"Reimu",description:"A compact Codex digital pet inspired by Hakurei Reimu, a calm shrine maiden from Touhou.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/reimu--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/reimu--lingxiaotian-thumb.webp",version:1,tags:["anime","touhou","touhou-project","shrine-maiden","reimu","hakurei-reimu"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/reimu--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/reimu--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["touhou-project"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/reimu--lingxiaotian",spritesheetSha256:"b438b769665feb0c2c5c6f87d489af4d7eb3515e89c6ef19222587d4e9cf1677",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"rinami--siiverash",title:"Rinami Himesaki",englishTitle:"Rinami Himesaki",description:"A Rinami Himesaki-inspired fan-art Codex pet with long wavy light-brown hair, crown-braid styling, a navy-and-gold school-uniform palette, and a compact chibi pixel sprite identity.",category:"\u52A8\u6F2B\u89D2\u8272",author:"SiIverAsh",authorHandle:"SiIverAsh",kind:"pet",atlas:"assets/pets/upstream-20261009/rinami--siiverash.webp",thumbnail:"assets/pets/upstream-20261009/rinami--siiverash-thumb.webp",version:1,tags:["gakuen-idolmaster","rinami-himesaki","pixel-art","hatch-pet"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/rinami--siiverash",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/rinami--siiverash.zip",date:"",importedAt:"2026-10-09",collections:["gakuen-idolmaster"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/rinami--siiverash",spritesheetSha256:"1547fb38ec66c26f0426984e0efe5c051febf11d78250695e4defa13c9fa1f75",metadataNameAlias:!1,authorUrl:"https://github.com/SiIverAsh"},{id:"robin--lingxiaotian",title:"\u77E5\u66F4\u9E1F",englishTitle:"Robin",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u77E5\u66F4\u9E1F\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u6D45\u84DD\u767D\u793C\u670D\u3001\u5206\u53C9\u91D1\u8272\u5149\u73AF\u4E0E\u6B4C\u59EC\u6C14\u8D28\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/robin--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/robin--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","robin","angelic","blue"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/robin--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/robin--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/robin--lingxiaotian",spritesheetSha256:"2a34d75d2aab0385b12d9b920c9aa30e6804dd74505eebc08308715459a6ca8b",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"ruan-mei--lingxiaotian",title:"\u962E\xB7\u6885",englishTitle:"Ruan Mei",description:"\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u962E\u6885\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u9752\u7EFF\u6E10\u53D8\u3001\u6885\u82B1/\u7434\u5F26\u611F\u3001\u51B7\u9759\u8868\u60C5\u3002.",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/ruan-mei--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/ruan-mei--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","ruan-mei","teal","elegant"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruan-mei--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/ruan-mei--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/ruan-mei--lingxiaotian",spritesheetSha256:"829c613e78e4c9b3b0e727984f1077ca88c98e17c16a219837ebdd258ed7ad05",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"ruruka--ltmcliao-cmyk",title:"RuRuKa",englishTitle:"RuRuKa",description:"RuRuKa is a 3D-style black-and-cream glasses companion with expressive Codex workflow animations.",category:"\u539F\u521B\u89D2\u8272",author:"ltmcliao-cmyk",authorHandle:"ltmcliao-cmyk",kind:"pet",atlas:"assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.webp",thumbnail:"assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk-thumb.webp",version:1,tags:["ruruka","3d","glasses","animated","codex","workflow"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/ruruka--ltmcliao-cmyk",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/ruruka--ltmcliao-cmyk.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/ruruka--ltmcliao-cmyk",spritesheetSha256:"9bec1eb0abf2ba4c28d397782f64b08ff7cb6aeb4b533338e7989cec6215c55c",metadataNameAlias:!1,authorUrl:"https://github.com/ltmcliao-cmyk"},{id:"saki--rookie-09",title:"Saki",englishTitle:"Saki",description:"A tiny cyan pixel-style Saki mascot with wings, cat ears, and cheerful desktop-pet animations.",category:"\u5409\u7965\u7269",author:"rookie-09",authorHandle:"rookie-09",kind:"pet",atlas:"assets/pets/upstream-20261009/saki--rookie-09.webp",thumbnail:"assets/pets/upstream-20261009/saki--rookie-09-thumb.webp",version:1,tags:["saki","cyan","pixel-art","mascot","wings","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/saki--rookie-09",license:"MIT License",download:"assets/pets/upstream-20261009/saki--rookie-09.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/saki--rookie-09",spritesheetSha256:"61ea42dffd8aaaaa3136450085d122efcdf860fa495a17105ba1559ee17a2148",metadataNameAlias:!1,authorUrl:"https://github.com/rookie-09"},{id:"serge-le-lapin--legeling",title:"Serge le Lapin",englishTitle:"Serge le Lapin",description:"\u4E00\u53EA\u7C89\u8272\u957F\u8033\u3001\u767D\u8272\u53E3\u9F3B\u3001\u9EC4\u4E0A\u8863\u548C\u84DD\u88E4\u5B50\u7684\u6D3B\u6CFC Q \u7248\u5154\u5B50\u4F19\u4F34\u3002",category:"\u5409\u7965\u7269",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/serge-le-lapin--legeling.webp",thumbnail:"assets/pets/upstream-20261009/serge-le-lapin--legeling-thumb.webp",version:2,tags:["serge-le-lapin","community-request","ai-generated","mascot","rabbit","sticker","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/serge-le-lapin--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u76F8\u5173\u89D2\u8272\u6216\u5546\u6807\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/serge-le-lapin--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/serge-le-lapin--legeling",spritesheetSha256:"4087884d17cd353dffe0b73966e26ce144071a907f46935644fe2579b7a74293",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"shian-helper--mistyshen",title:"Shian",englishTitle:"Shian",description:"A soft blonde chibi coding companion with black-and-orange bows and a gentle expression.",category:"\u539F\u521B\u89D2\u8272",author:"mistyShen",authorHandle:"mistyShen",kind:"pet",atlas:"assets/pets/upstream-20261009/shian-helper--mistyshen.webp",thumbnail:"assets/pets/upstream-20261009/shian-helper--mistyshen-thumb.webp",version:1,tags:["shian","blonde","chibi","bows","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shian-helper--mistyshen",license:"MIT License",download:"assets/pets/upstream-20261009/shian-helper--mistyshen.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/shian-helper--mistyshen",spritesheetSha256:"4ddbd7d55353ce292e34afbd570efceeb4cb476c397034ddec98319b99c82d8d",metadataNameAlias:!1,authorUrl:"https://github.com/mistyShen"},{id:"silver-wolf--lingxiaotian",title:"\u94F6\u72FC",englishTitle:"Silver Wolf",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u94F6\u72FC\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7D2B\u7070\u77ED\u53D1\u3001\u9ED1\u5BA2\u611F\u62A4\u76EE\u955C\u4E0E\u9ED1\u7D2B\u673A\u80FD\u7A7F\u642D\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u50CF\u7D20\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/silver-wolf--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/silver-wolf--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","silver-wolf","hacker","cyber"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/silver-wolf--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/silver-wolf--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/silver-wolf--lingxiaotian",spritesheetSha256:"6bae5695b739d8503ef5895ba4282e46dcee78dbacf891b50b40d7ef3f237289",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"sparkle--lingxiaotian",title:"\u82B1\u706B",englishTitle:"Sparkle",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u82B1\u706B\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7EA2\u9ED1\u914D\u8272\u3001\u53CC\u9A6C\u5C3E\u3001\u9762\u5177\u548C\u4FCF\u76AE\u620F\u5267\u611F\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/sparkle--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/sparkle--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","sparkle","mask","twin-tails"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sparkle--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/sparkle--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/sparkle--lingxiaotian",spritesheetSha256:"8b55199ed720169f8f50d2eec6c846741f16c706e6bfc181192d1970a51ba4e2",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"st-tibo-reset--wynn",title:"St. Tibo Reset",englishTitle:"St. Tibo Reset",description:"A serene, cross-legged Tibo in green and gold robes, ready to press his big red RESET button and give your work a fresh start.",category:"\u7F51\u7EDC\u6897\u56FE",author:"wynn",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/st-tibo-reset--wynn.webp",thumbnail:"assets/pets/upstream-20261009/st-tibo-reset--wynn-thumb.webp",version:2,tags:["meme","human","3d","green"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/st-tibo-reset--wynn",license:"Non-commercial use and redistribution only, with credit to wynn, to the extent the contributor holds rights in this work. Reference imagery and the depicted person's rights remain with their respective rightsholders and are not licensed by this submission. Unofficial fan art; no affiliation or endorsement is claimed. These terms do not establish third-party rights clearance. Please contact the contributor or maintainers with rights concerns so the submission can be reviewed, revised, or removed.",download:"assets/pets/upstream-20261009/st-tibo-reset--wynn.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/st-tibo-reset--wynn",spritesheetSha256:"812f83e1ca0f93de2cfffa9c29525cfe6f8667d001e8cd106e2164f9de7ce25c",metadataNameAlias:!1},{id:"starcorn--alterhq",title:"Starcorn",englishTitle:"Starcorn",description:"A white chibi unicorn with a multicolor horn and a yellow star marking.",category:"\u5E7B\u60F3\u751F\u7269",author:"Alter",authorHandle:"alterhq",kind:"pet",atlas:"assets/pets/upstream-20261009/starcorn--alterhq.webp",thumbnail:"assets/pets/upstream-20261009/starcorn--alterhq-thumb.webp",version:1,tags:["unicorn","fantasy","creature","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/starcorn--alterhq",license:"MIT License",download:"assets/pets/upstream-20261009/starcorn--alterhq.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/starcorn--alterhq",spritesheetSha256:"d2d91b5339bc46662feddbab643e4fb92278de18281859fb37fcf77cc2a65d66",metadataNameAlias:!1,authorUrl:"https://github.com/alterhq"},{id:"sunny-retriever--legeling",title:"\u6696\u9633\u91D1\u6BDB",englishTitle:"Sunny Retriever",description:"A cheerful honey-gold retriever puppy with a teal collar, expressive task animations, and 16 look directions.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/sunny-retriever--legeling.webp",thumbnail:"assets/pets/upstream-20261009/sunny-retriever--legeling-thumb.webp",version:2,tags:["golden-retriever","dog","puppy","teal-collar","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/sunny-retriever--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/sunny-retriever--legeling.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/sunny-retriever--legeling",spritesheetSha256:"447a79a275ba01fcef5805c5e4ec3dccce7d8836e0492af28fb81a5ce7898ee0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"tangdouren--carl312",title:"Tangdouren",englishTitle:"Tangdouren",description:"A chibi big-headed girl pet with side-parted brown bob hair and glossy eyes.",category:"\u4EBA\u7269\u5934\u50CF",author:"Carl-312",authorHandle:"Carl-312",kind:"pet",atlas:"assets/pets/upstream-20261009/tangdouren--carl312.webp",thumbnail:"assets/pets/upstream-20261009/tangdouren--carl312-thumb.webp",version:1,tags:["chibi","person","brown-hair","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tangdouren--carl312",license:"MIT License",download:"assets/pets/upstream-20261009/tangdouren--carl312.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tangdouren--carl312",spritesheetSha256:"216b994b833f54fef6f719c6c42e116e666fa7d7d2b40f31f5d2acb872a8411a",metadataNameAlias:!1,authorUrl:"https://github.com/Carl-312"},{id:"tian-hua-hua--d1a0y1bb",title:"Tian Hua Hua",englishTitle:"Tian Hua Hua",description:"A round calico cat companion with sleepy eyes and a calm, slightly serious expression.",category:"\u52A8\u7269\u4F19\u4F34",author:"D1a0y1bb",authorHandle:"D1a0y1bb",kind:"pet",atlas:"assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.webp",thumbnail:"assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb-thumb.webp",version:1,tags:["cat","calico","round","sleepy","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tian-hua-hua--d1a0y1bb",license:"MIT License",download:"assets/pets/upstream-20261009/tian-hua-hua--d1a0y1bb.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tian-hua-hua--d1a0y1bb",spritesheetSha256:"5aaa783e17577b92ebdfd2070c95916245be0c378ac6931ef7fa98bb99cb6dc6",metadataNameAlias:!1,authorUrl:"https://github.com/D1a0y1bb"},{id:"tingyun--lingxiaotian",title:"\u505C\u4E91",englishTitle:"Tingyun",description:"\u300A\u5D29\u574F\uFF1A\u661F\u7A79\u94C1\u9053\u300B\u505C\u4E91\u98CE\u683C\u7684\u539F\u521B Codex chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u72D0\u8033\u4E0E\u5927\u5C3E\u5DF4\u3001\u91D1\u68D5\u7EA2\u914D\u8272\u3001\u7EFF\u773C\u548C\u6E29\u67D4\u4F18\u96C5\u7684\u795E\u6001\u90FD\u88AB\u538B\u7F29\u8FDB\u5C0F\u4F53\u91CF\u52A8\u753B\u91CC\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/tingyun--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/tingyun--lingxiaotian-thumb.webp",version:1,tags:["anime","honkai-star-rail","tingyun","fox-ears","gold-brown"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tingyun--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/tingyun--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["honkai-star-rail"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tingyun--lingxiaotian",spritesheetSha256:"18c19bc5f493c11f37b83f0d2a2bb861525ab1adf3b05eaba407c1fd9210796a",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"wally--wally025",title:"Wally",englishTitle:"Wally",description:"A cheerful little white guide mascot for builds, reviews, and clean progress.",category:"\u5409\u7965\u7269",author:"Wally Pet Contributors",authorHandle:"wally025",kind:"pet",atlas:"assets/pets/upstream-20261009/wally--wally025.webp",thumbnail:"assets/pets/upstream-20261009/wally--wally025-thumb.webp",version:1,tags:["wally","mascot","white","guide","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/wally--wally025",license:"MIT License",download:"assets/pets/upstream-20261009/wally--wally025.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/wally--wally025",spritesheetSha256:"f9b7d6dd1f9ab97f94d83b78b05f1246fc7c73b9c3c4678fd4ae314a41e25483",metadataNameAlias:!1,authorUrl:"https://github.com/wally025"},{id:"warden-codex--jorge-cuevas90003",title:"Warden Codex",englishTitle:"Warden Codex",description:"An original chibi armored guardian in olive-green sci-fi power armor with a gold visor, always carrying his rifle.",category:"\u539F\u521B\u89D2\u8272",author:"Jorge Cuevas",authorHandle:"Jorge-Cuevas90003",kind:"pet",atlas:"assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.webp",thumbnail:"assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003-thumb.webp",version:2,tags:["sci-fi","armored","guardian","chibi","original","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/warden-codex--jorge-cuevas90003",license:"CC BY-NC 4.0. Original AI-assisted artwork created for and submitted by Jorge Cuevas; no third-party source assets were used.",download:"assets/pets/upstream-20261009/warden-codex--jorge-cuevas90003.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/warden-codex--jorge-cuevas90003",spritesheetSha256:"7c51b5594653a8934002c8329b50a1b414764261b778aa5541ece7cc89db7285",metadataNameAlias:!1,authorUrl:"https://github.com/Jorge-Cuevas90003"},{id:"xian-xiao-lu--qingyunagi",title:"Xian Xiao Lu",englishTitle:"Xian Xiao Lu",description:"A peaceful little xianxia deer sitting on a cloud with a gourd and fly-whisk.",category:"\u5E7B\u60F3\u751F\u7269",author:"qingyunAGI",authorHandle:"qingyunAGI",kind:"pet",atlas:"assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.webp",thumbnail:"assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi-thumb.webp",version:1,tags:["deer","xianxia","cloud","peaceful","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xian-xiao-lu--qingyunagi",license:"MIT License",download:"assets/pets/upstream-20261009/xian-xiao-lu--qingyunagi.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xian-xiao-lu--qingyunagi",spritesheetSha256:"17bc75e7d3a9c026ce8210572327b89fade9bba490f7b079d6bd3b96805354e1",metadataNameAlias:!1,authorUrl:"https://github.com/qingyunAGI"},{id:"yier--gbn666",title:"Yi Er",englishTitle:"Yi Er",description:"A soft, gentle white chibi desktop pet with dark round ears, pink cheeks, and a shy expression.",category:"\u539F\u521B\u89D2\u8272",author:"Guo Beining",authorHandle:"gbn666",kind:"pet",atlas:"assets/pets/upstream-20261009/yier--gbn666.webp",thumbnail:"assets/pets/upstream-20261009/yier--gbn666-thumb.webp",version:1,tags:["chibi","pixel-art","soft","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yier--gbn666",license:"MIT License",download:"assets/pets/upstream-20261009/yier--gbn666.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yier--gbn666",spritesheetSha256:"5b0a84b5094172d965f82f7ba5962b35fad898274878cb492a3efe98b4c70b15",metadataNameAlias:!1,authorUrl:"https://github.com/gbn666"},{id:"yuanzai--gaming33",title:"Yuanzai",englishTitle:"Yuanzai",description:"A cute cat-headed bee companion with tiny wings, striped colors, and a gentle round face.",category:"\u5E7B\u60F3\u751F\u7269",author:"Gaming33",authorHandle:"Gaming33",kind:"pet",atlas:"assets/pets/upstream-20261009/yuanzai--gaming33.webp",thumbnail:"assets/pets/upstream-20261009/yuanzai--gaming33-thumb.webp",version:1,tags:["cat","bee","striped","cute","round","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanzai--gaming33",license:"MIT License",download:"assets/pets/upstream-20261009/yuanzai--gaming33.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yuanzai--gaming33",spritesheetSha256:"15f11b04440047f6a994e582bd2223454aacf3da86c197069bbfbe8d37101b7d",metadataNameAlias:!1,authorUrl:"https://github.com/Gaming33"},{id:"yuzubou--keseras34938976",title:"Yuzubou",englishTitle:"Yuzubou",description:"A cheerful little yuzu monk in a straw hat, leaf cap, robes, and prayer beads.",category:"\u539F\u521B\u89D2\u8272",author:"Keseras34938976",authorHandle:"Keseras34938976",kind:"pet",atlas:"assets/pets/upstream-20261009/yuzubou--keseras34938976.webp",thumbnail:"assets/pets/upstream-20261009/yuzubou--keseras34938976-thumb.webp",version:1,tags:["yuzu","monk","straw-hat","leaf","cute","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuzubou--keseras34938976",license:"MIT License",download:"assets/pets/upstream-20261009/yuzubou--keseras34938976.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yuzubou--keseras34938976",spritesheetSha256:"8e1bd8a6e5b0d5a644933bb8cc40615a8877e573d49fe436492d4c586c576fad",metadataNameAlias:!1,authorUrl:"https://github.com/Keseras34938976"},{id:"uesugi-erii--ricardo-2005",title:"\u4E0A\u6749\u7ED8\u68A8\u8863codex\u5BA0\u7269",englishTitle:"\u4E0A\u6749\u7ED8\u68A8\u8863codex\u5BA0\u7269",description:"\u4E0A\u6749\u7ED8\u68A8\u8863\u7684\u975E\u5B98\u65B9 AI \u540C\u4EBA Codex \u684C\u9762\u5BA0\u7269\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"Ricardo-2005",authorHandle:"Ricardo-2005",kind:"pet",atlas:"assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.webp",thumbnail:"assets/pets/upstream-20261009/uesugi-erii--ricardo-2005-thumb.webp",version:2,tags:["dragon-raja","uesugi-erii","anime","fan-art","red-hair","pixel-art","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/uesugi-erii--ricardo-2005",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u4F5C\u54C1\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",download:"assets/pets/upstream-20261009/uesugi-erii--ricardo-2005.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/uesugi-erii--ricardo-2005",spritesheetSha256:"584ad142250b0bf601faa876618e38468de77dd5d7cc4e149e3cad1544f4b253",metadataNameAlias:!1,authorUrl:"https://github.com/Ricardo-2005"},{id:"yuanbao--legeling",title:"\u5143\u5B9D",englishTitle:"\u5143\u5B9D",description:"\u4E00\u53EA\u7070\u767D\u76F8\u95F4\u3001\u5E26\u82CF\u683C\u5170\u6298\u8033\u7279\u5F81\u548C\u5927\u5706\u773C\u7684\u534A\u5199\u5B9E\u864E\u6591\u732B\u684C\u9762\u4F19\u4F34\u3002",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/yuanbao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/yuanbao--legeling-thumb.webp",version:2,tags:["cat","scottish-fold","tabby","gray-white","community-request","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yuanbao--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/yuanbao--legeling.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yuanbao--legeling",spritesheetSha256:"dd37bd8664636ea6639ad4bf5e1ea50e82a5864b72520f88fb5fabc80222fa50",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"yae-miko--legeling",title:"\u516B\u91CD\u795E\u5B50",englishTitle:"Yae Miko",description:"\u300A\u539F\u795E\u300B\u516B\u91CD\u795E\u5B50\u7075\u611F\u7684\u539F\u521B\u975E\u5546\u4E1A Codex v2 chibi \u50CF\u7D20\u5BA0\u7269\uFF0C\u7C89\u8272\u957F\u53D1\u3001\u72D0\u8033\u3001\u7EA2\u767D\u5DEB\u5973\u670D\u4E0E\u7D2B\u91D1\u914D\u9970\u88AB\u538B\u7F29\u6210\u7A33\u5B9A\u53EF\u8BFB\u7684\u5C0F\u4F53\u578B\u5F62\u8C61\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/yae-miko--legeling.webp",thumbnail:"assets/pets/upstream-20261009/yae-miko--legeling-thumb.webp",version:2,tags:["genshin-impact","yae-miko","kitsune","shrine-maiden","pink-hair","pixel-art","chibi","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/yae-miko--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/yae-miko--legeling.zip",date:"",importedAt:"2026-10-09",collections:["genshin-impact"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/yae-miko--legeling",spritesheetSha256:"5b211fae44ff5bd4541dcce1c01d378af30ed3c670b205b67d5a3c4c3323b884",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"liuboer--legeling",title:"\u5218\u6CE2\u513F",englishTitle:"\u5218\u6CE2\u513F",description:"A slim black Devon Rex with enormous triangular ears, yellow-green eyes and a short rippled coat.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/liuboer--legeling.webp",thumbnail:"assets/pets/upstream-20261009/liuboer--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liuboer--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/liuboer--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/liuboer--legeling",spritesheetSha256:"ac28440619bc4f318a386608ca6753a5a331b1d6f5cc8e36095f8b07c9f71614",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"miku-sea--legeling",title:"\u521D\u97F3\u672A\u6765\xB7\u6D77\u8272",englishTitle:"Hatsune Miku \xB7 Sea Colors",description:"\u5FE0\u5B9E\u4E8E\u8BF7\u6C42\u8005\u516D\u5E27\u6D77\u8272\u521D\u7A3F\u7684\u521D\u97F3\u672A\u6765\u590F\u88C5\u540C\u4EBA\u5BA0\u7269\uFF1A\u8349\u5E3D\u3001\u753B\u9762\u53F3\u4FA7\u767D\u8774\u8776\u7ED3\u3001\u767D\u84DD\u88D9\u88C5\u3001\u9752\u8272\u53CC\u9A6C\u5C3E\u548C\u8D64\u811A\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/miku-sea--legeling.webp",thumbnail:"assets/pets/upstream-20261009/miku-sea--legeling-thumb.webp",version:2,tags:["community-request","hatsune-miku","summer"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/miku-sea--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/miku-sea--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/miku-sea--legeling",spritesheetSha256:"2805e8f175d75231a0ea07a7fb9d4dc00203127b2dfa071810fc2f7aa7e68d77",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"gudong--rank",title:"\u5495\u549A",englishTitle:"\u5495\u549A",description:"A crown-wearing rabbit king with a leafy forelock, burgundy cape, and playful oversized eyes.",category:"\u539F\u521B\u89D2\u8272",author:"Rank",authorHandle:"Rank",kind:"pet",atlas:"assets/pets/upstream-20261009/gudong--rank.webp",thumbnail:"assets/pets/upstream-20261009/gudong--rank-thumb.webp",version:2,tags:["original-character","rabbit","king","crown","cape","cartoon","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gudong--rank",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/gudong--rank.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/gudong--rank",spritesheetSha256:"9a2cf19c6b2a24ac5e5950576d65ae957890938a416b5e177f0f93e48555c0f3",metadataNameAlias:!1},{id:"tuantuan--jbbom",title:"\u56E2\u56E2",englishTitle:"\u56E2\u56E2",description:"A soft, friendly orange-and-white shorthair kitten for Codex.",category:"\u52A8\u7269\u4F19\u4F34",author:"JbBom",authorHandle:"JbBom",kind:"pet",atlas:"assets/pets/upstream-20261009/tuantuan--jbbom.webp",thumbnail:"assets/pets/upstream-20261009/tuantuan--jbbom-thumb.webp",version:1,tags:["cat","kitten","orange-white","pixel-art","codex"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/tuantuan--jbbom",license:"MIT License",download:"assets/pets/upstream-20261009/tuantuan--jbbom.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/tuantuan--jbbom",spritesheetSha256:"1b3b74e0688ad5db0b1e242eee4aa6facc746456f66cfe810877813b3ef65b62",metadataNameAlias:!1,authorUrl:"https://github.com/JbBom"},{id:"virtuosa--legeling",title:"\u5851\u5FC3\u963F\u5C14\u56FE\u7F57",englishTitle:"Virtuosa / Arturia",description:"\u6309\u793E\u533A\u53C2\u8003\u5236\u4F5C\u7684\u300A\u660E\u65E5\u65B9\u821F\u300B\u5851\u5FC3\u963F\u5C14\u56FE\u7F57\u540C\u4EBA\u5BA0\u7269\uFF0C\u4FDD\u7559\u9ED1\u53D1\u3001\u91D1\u773C\u3001\u9ED1\u91D1\u788E\u7247\u5149\u73AF\u548C\u7FFC\u72B6\u6784\u9020\u3002AI \u751F\u6210\uFF0C\u811A\u9774\u8865\u5168\u5DF2\u83B7\u5236\u4F5C\u5BA1\u6838\u8BA4\u53EF\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/virtuosa--legeling.webp",thumbnail:"assets/pets/upstream-20261009/virtuosa--legeling-thumb.webp",version:2,tags:["community-request","arknights","virtuosa"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/virtuosa--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/virtuosa--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/virtuosa--legeling",spritesheetSha256:"522496bafedb3c0fd368d82f1f8e933680c6c645799a40cc9790e03ad5024f90",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"dashu--legeling",title:"\u5927\u9F20",englishTitle:"\u5927\u9F20",description:"Da Shu from \u5927\u9F20\u4E0E\u7F8E\u53FD, with a broad gray face, pink ears, a cheerful toothy smile and a tiny body.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/dashu--legeling.webp",thumbnail:"assets/pets/upstream-20261009/dashu--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dashu--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/dashu--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/dashu--legeling",spritesheetSha256:"b922ad1ea917101bf5e39cd9c35dedd134d44164a12496736dbffa3332e10b84",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"dnf-female-ammo--qunboo",title:"dnf-female-ammo",englishTitle:"\u5973\u5F39\u836FQ",description:"A chibi-style Dungeon Fighter Online Female Mechanic (Ammo) desktop pet, featuring idle breathing and gun-twirl animations.",category:"\u6E38\u620F\u89D2\u8272",author:"QunBoo",authorHandle:"QunBoo",kind:"pet",atlas:"assets/pets/upstream-20261009/dnf-female-ammo--qunboo.webp",thumbnail:"assets/pets/upstream-20261009/dnf-female-ammo--qunboo-thumb.webp",version:1,tags:["dnf","dungeon-fighter","dungeon-fighter-online","female-ammo","game","chibi"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/dnf-female-ammo--qunboo",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/dnf-female-ammo--qunboo.zip",date:"",importedAt:"2026-10-09",collections:["dungeon-fighter-online"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/dnf-female-ammo--qunboo",spritesheetSha256:"6c86347073986e57148f7b81980866c7ac2c68c1112b93a85519a142b208f59d",metadataNameAlias:!1,authorUrl:"https://github.com/QunBoo"},{id:"naiwa--sandytruant",title:"\u5976\u86D9",englishTitle:"\u5976\u86D9",description:"A yellow pear-shaped pixel companion that laughs when hovered.",category:"\u52A8\u7269\u4F19\u4F34",author:"Yitian Sun",authorHandle:"sandytruant",kind:"pet",atlas:"assets/pets/upstream-20261009/naiwa--sandytruant.webp",thumbnail:"assets/pets/upstream-20261009/naiwa--sandytruant-thumb.webp",version:2,tags:["frog","yellow","pixel-art","look-directions","codex-v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/naiwa--sandytruant",license:"MIT License",download:"assets/pets/upstream-20261009/naiwa--sandytruant.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/naiwa--sandytruant",spritesheetSha256:"5db71125ea2d30beb8507d7aae1e38521efa6db4f7cde6b1ced1a8b3a8d6439f",metadataNameAlias:!1,authorUrl:"https://github.com/sandytruant"},{id:"vyron--legeling",title:"\u5A01\u9F99",englishTitle:"Vyron",description:"An AI-generated, weapon-free community interpretation of Vyron from Delta Force, based on the Issue #234 reference. The specific game skin is unverified.",category:"\u5176\u4ED6",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/vyron--legeling.webp",thumbnail:"assets/pets/upstream-20261009/vyron--legeling-thumb.webp",version:2,tags:["community-request","ai-generated","fan-art","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/vyron--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/vyron--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/vyron--legeling",spritesheetSha256:"47d2430a4b59e3bac88ee9bb2a5912a14c8be077e7908db0244c34583683b8a7",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"xiaoda--legeling",title:"\u5C0F\u8FBE",englishTitle:"\u5C0F\u8FBE",description:"\u4E00\u53EA\u84DD\u767D\u914D\u8272\u3001\u5927\u773C\u3001\u53CC\u5929\u7EBF\u548C\u989D\u5934\u5C4F\u5E55\u7684\u8F6F\u8D28 3D Q \u7248\u673A\u5668\u4EBA\u4F19\u4F34\u3002",category:"\u673A\u5668\u4EBA",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/xiaoda--legeling.webp",thumbnail:"assets/pets/upstream-20261009/xiaoda--legeling-thumb.webp",version:2,tags:["xiaoda","community-request","ai-generated","robot","mascot","3d-toy","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiaoda--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u7D20\u6750\u76F8\u5173\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/xiaoda--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xiaoda--legeling",spritesheetSha256:"0e53ff190a3a51b22e956728a708f98575b1b9e5a871b463e08511162a89df26",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"little-black-cat--legeling",title:"\u5C0F\u9ED1\u732B",englishTitle:"\u5C0F\u9ED1\u732B",description:"A fuzzy brush-painted black cat with slanted golden eyes, a blue nose and an inquisitive gaze.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/little-black-cat--legeling.webp",thumbnail:"assets/pets/upstream-20261009/little-black-cat--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/little-black-cat--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/little-black-cat--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/little-black-cat--legeling",spritesheetSha256:"71cc9fa9b9f8d581370963e457e924af5e40e02a889b5ea191ba2566fa1d1309",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"iuno--legeling",title:"\u5C24\u8BFA",englishTitle:"Iuno",description:"\u5BF9\u5E94\u793E\u533A\u8BF7\u6C42 #176 \u4E0E #177 \u7684\u300A\u9E23\u6F6E\u300B\u5C24\u8BFA\u540C\u4EBA\u5BA0\u7269\uFF0C\u84DD\u8272\u53CC\u9A6C\u5C3E\u3001\u767D\u91D1\u670D\u88C5\u548C\u624B\u6301\u84DD\u91D1\u5706\u73AF\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/iuno--legeling.webp",thumbnail:"assets/pets/upstream-20261009/iuno--legeling-thumb.webp",version:2,tags:["community-request","wuthering-waves","iuno"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/iuno--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/iuno--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/iuno--legeling",spritesheetSha256:"1ca0398437916007ee8f28b4b913e7bdea39eb1d5ac90a2fa5fe659682fac468",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"bubu-codebrew-bear--xxhh0822",title:"\u5E03\u5E03",englishTitle:"\u5E03\u5E03",description:"A focused cocoa-brown bear coding at a cyan laptop with a small white coffee mug.",category:"\u5409\u7965\u7269",author:"xxhh0822",authorHandle:"xxhh0822",kind:"pet",atlas:"assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.webp",thumbnail:"assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822-thumb.webp",version:2,tags:["bear","coding","laptop","coffee","chibi","original","ai-generated","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bubu-codebrew-bear--xxhh0822",license:"CC BY-NC 4.0. Original AI-assisted artwork submitted by xxhh0822 for non-commercial use; no third-party source pixels were copied.",download:"assets/pets/upstream-20261009/bubu-codebrew-bear--xxhh0822.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/bubu-codebrew-bear--xxhh0822",spritesheetSha256:"20c82a9e88e9561ab3a6f632d8eed1cca5df755fcb500ccdf9a4b576e69e1334",metadataNameAlias:!1,authorUrl:"https://github.com/xxhh0822"},{id:"koukou-penguin--hoody",title:"\u6263\u6263\u4F01\u9E45",englishTitle:"\u6263\u6263\u4F01\u9E45",description:"\u4E00\u53EA\u6234\u7740\u7EA2\u56F4\u5DFE\u3001\u4F1A\u7728\u773C\u7684\u5706\u6EDA\u6EDA\u9ED1\u767D\u4F01\u9E45\u4F19\u4F34\u3002",category:"\u52A8\u7269\u4F19\u4F34",author:"hoody",authorHandle:"hoody",kind:"pet",atlas:"assets/pets/upstream-20261009/koukou-penguin--hoody.webp",thumbnail:"assets/pets/upstream-20261009/koukou-penguin--hoody-thumb.webp",version:2,tags:["penguin","animal","red-scarf","3d-toy","original"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/koukou-penguin--hoody",license:"CC BY-NC 4.0. Original asset created by hoody; no third-party source asset.",download:"assets/pets/upstream-20261009/koukou-penguin--hoody.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/koukou-penguin--hoody",spritesheetSha256:"53f3a730f8485d351976b51c7b918953381a92be95387df17d481069f5defa5c",metadataNameAlias:!1},{id:"xuxu-baobao--legeling",title:"\u65ED\u65ED\u5B9D\u5B9D",englishTitle:"\u65ED\u65ED\u5B9D\u5B9D",description:"An AI-generated miniature avatar based on the reference supplied with request #115, with nine animation states and sixteen look directions. The accepted scope is the V2 sprite package; custom desktop interaction and voice features are outside this delivery.",category:"\u4EBA\u7269\u5934\u50CF",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/xuxu-baobao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/xuxu-baobao--legeling-thumb.webp",version:2,tags:["human-avatar","ai-generated","codex-v2","community-request"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xuxu-baobao--legeling",license:"CC BY-NC 4.0 for this AI-generated sprite asset; non-commercial use only. Commercial use is prohibited. Rights in the depicted person's identity and supplied reference photograph remain with their respective rights holders.",download:"assets/pets/upstream-20261009/xuxu-baobao--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xuxu-baobao--legeling",spritesheetSha256:"fee42cb0b3a51735520ba506534b9c78583eea7ac2948fd48332c220806ee9a0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"hance-woniu--korn",title:"\u65F1\u5395\u8717\u725B",englishTitle:"\u65F1\u5395\u8717\u725B",description:"\u4E00\u4E2A\u61A8\u61A8\u5FAE\u7B11\u3001\u5634\u89D2\u6302\u7740\u84DD\u8272\u53E3\u6C34\u7684\u767D\u8272\u5706\u5934\u7F51\u7EDC\u6897\u5BA0\u7269\u3002",category:"\u7F51\u7EDC\u6897\u56FE",author:"korn",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/hance-woniu--korn.webp",thumbnail:"assets/pets/upstream-20261009/hance-woniu--korn-thumb.webp",version:2,tags:["meme","douyin","white-mascot","drool","hand-drawn","codex-v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hance-woniu--korn",license:"CC BY-NC 4.0 (korn's original three-view artwork and this Codex pet adaptation only; no claim over third-party meme materials)",download:"assets/pets/upstream-20261009/hance-woniu--korn.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hance-woniu--korn",spritesheetSha256:"8ba2e9a2964c88f93b533e35fc69148da6d314e74711c86fd4231e09a4305255",metadataNameAlias:!1},{id:"liubao--killyer",title:"\u69B4\u5B9D",englishTitle:"\u69B4\u5B9D",description:"\u4E00\u53EA\u5706\u6EDA\u6EDA\u3001\u67D4\u8F6F\u4EB2\u5207\u7684\u69B4\u83B2\u6BDB\u7ED2\u684C\u9762\u5BA0\u7269\u3002",category:"\u539F\u521B\u89D2\u8272",author:"Shawnzhou",authorHandle:"",kind:"pet",atlas:"assets/pets/upstream-20261009/liubao--killyer.webp",thumbnail:"assets/pets/upstream-20261009/liubao--killyer-thumb.webp",version:2,tags:["original","durian","plush","cute"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/liubao--killyer",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/liubao--killyer.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/liubao--killyer",spritesheetSha256:"65954ab3eeb02772ebac5f4fb05279fa5d2f88bd93c4132eea54d3a3b50d9b4b",metadataNameAlias:!1},{id:"shen-xinghui--legeling",title:"\u6C88\u661F\u56DE",englishTitle:"\u6C88\u661F\u56DE",description:"\u4E00\u4F4D\u94F6\u7070\u53D1\u3001\u84DD\u7D2B\u773C\u3001\u8EAB\u7740\u6D45\u8272\u672A\u6765\u5236\u670D\u7684\u6E29\u67D4 Q \u7248\u4F19\u4F34\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/shen-xinghui--legeling.webp",thumbnail:"assets/pets/upstream-20261009/shen-xinghui--legeling-thumb.webp",version:2,tags:["love-and-deepspace","shen-xinghui","community-request","ai-generated","fan-art","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/shen-xinghui--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u300A\u604B\u4E0E\u6DF1\u7A7A\u300B\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",download:"assets/pets/upstream-20261009/shen-xinghui--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/shen-xinghui--legeling",spritesheetSha256:"d9fd7cfd22d33fb00a7ee6f5f1d29baa68919cb14ac1bda55ea1d8426c6e7ef3",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"otama--legeling",title:"\u6D77\u8D3C\u738B\u5C0F\u7389",englishTitle:"\u6D77\u8D3C\u738B\u5C0F\u7389",description:"\u300A\u6D77\u8D3C\u738B\u300B\u5C0F\u7389\uFF0C\u4FDD\u7559\u7D2B\u53D1\u82B1\u9970\u3001\u7EFF\u8272\u8865\u4E01\u548C\u670D\u3001\u9EC4\u8272\u8170\u5E26\u4E0E\u8349\u5C65\u7684 V2 \u52A8\u753B\u5BA0\u7269\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/otama--legeling.webp",thumbnail:"assets/pets/upstream-20261009/otama--legeling-thumb.webp",version:2,tags:["community-request","one-piece","otama"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/otama--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/otama--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/otama--legeling",spritesheetSha256:"df03b7e1628e5693dfeb324302b1920fe81eec427465488338f13aca5a3e35f3",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"neptune--legeling",title:"\u6D85\u666E\u7F07\u52AA",englishTitle:"Neptune",description:"\u6309\u793E\u533A\u8BF7\u6C42\u5236\u4F5C\u7684\u6D85\u666E\u7F07\u52AA\u666E\u901A\u5F62\u6001\u50CF\u7D20\u98CE\u540C\u4EBA\u5BA0\u7269\uFF0C\u767D\u7D2B\u8FDE\u5E3D\u5916\u5957\u3001\u65B9\u5411\u952E\u53D1\u5939\u548C\u7D2B\u8272\u978B\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/neptune--legeling.webp",thumbnail:"assets/pets/upstream-20261009/neptune--legeling-thumb.webp",version:2,tags:["community-request","neptunia","pixel-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/neptune--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/neptune--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/neptune--legeling",spritesheetSha256:"3a53c81e95231edb55c20393f417a9d8bfa3f278a7e22d05d9a185ad3432d28e",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"niulai--legeling",title:"\u725B\u6765",englishTitle:"\u725B\u6765",description:"\u4E00\u53EA\u6A59\u68D5\u8272\u3001\u77ED\u7070\u89D2\u3001\u5706\u773C\u548C\u6D45\u7C89\u53E3\u9F3B\u7684\u61A8\u840C Q \u7248\u725B\u4F19\u4F34\u3002",category:"\u7F51\u7EDC\u6897\u56FE",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/niulai--legeling.webp",thumbnail:"assets/pets/upstream-20261009/niulai--legeling-thumb.webp",version:2,tags:["niulai","community-request","ai-generated","meme","3d-toy","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/niulai--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u539F\u7D20\u6750\u76F8\u5173\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/niulai--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/niulai--legeling",spritesheetSha256:"dd95068c122aecebbb4056918eba49513e4969cb00b503b9494319f2b410e399",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"gift--legeling",title:"\u793C\u7269",englishTitle:"Gift",description:"A round tabby-white cat with green-yellow eyes, white paws and a thick ringed tail.",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/gift--legeling.webp",thumbnail:"assets/pets/upstream-20261009/gift--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/gift--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/gift--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/gift--legeling",spritesheetSha256:"978c742dcdc54d5260ba61a8337491acfe8f5969caa26f0b232d9e9ba5301617",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"luo-xiaohei--legeling",title:"\u7F57\u5C0F\u9ED1",englishTitle:"\u7F57\u5C0F\u9ED1",description:"\u4E00\u4F4D\u9ED1\u53D1\u3001\u7EFF\u773C\u3001\u6DE1\u7EFF\u89D2\u9970\u3001\u84DD\u8272\u4E0A\u8863\u4E0E\u5C0F\u9ED1\u5C3E\u5DF4\u7684 Q \u7248\u68EE\u6797\u4F19\u4F34\u3002",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/luo-xiaohei--legeling.webp",thumbnail:"assets/pets/upstream-20261009/luo-xiaohei--legeling-thumb.webp",version:2,tags:["luo-xiaohei","community-request","ai-generated","anime","forest-child","sticker","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/luo-xiaohei--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u793E\u533A\u8BE0\u91CA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u76F8\u5173\u89D2\u8272\u6216\u5546\u6807\u6743\u5229\u65B9\u6388\u6743\u3002",download:"assets/pets/upstream-20261009/luo-xiaohei--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/luo-xiaohei--legeling",spritesheetSha256:"52c8feff0a688e6b18791e452d5eff090823fcaf8306f8f1f8da64e30e15c468",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"xiang-an--legeling",title:"\u7FD4\u5B89",englishTitle:"\u7FD4\u5B89",description:"\u4E00\u5BF9\u5F69\u8272\u5916\u5957\u4E0E\u8584\u8377\u7EFF\u8FDE\u4F53\u8863\u7684 Q \u7248\u5144\u5F1F\u642D\u6863\u3002",category:"\u4EBA\u7269\u5934\u50CF",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/xiang-an--legeling.webp",thumbnail:"assets/pets/upstream-20261009/xiang-an--legeling-thumb.webp",version:2,tags:["community-request","ai-generated","sibling-duo","chibi","sticker","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/xiang-an--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002",download:"assets/pets/upstream-20261009/xiang-an--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/xiang-an--legeling",spritesheetSha256:"1e9a5dd74676341e18ec23752c877c94f293a3bb7ab91ff5a8ad7166bb2cd4ad",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"maodie--octane0411",title:"\u8004\u800B",englishTitle:"\u8004\u800B",description:"\u4E00\u53EA\u5706\u5934\u98DE\u673A\u8033\u3001\u7C89\u9F3B\u772F\u773C\uFF0C\u51F6\u840C\u53C8\u5014\u5F3A\u7684\u6A58\u767D\u732B\u3002",category:"\u7F51\u7EDC\u6897\u56FE",author:"Octane0411",authorHandle:"Octane0411",kind:"pet",atlas:"assets/pets/upstream-20261009/maodie--octane0411.webp",thumbnail:"assets/pets/upstream-20261009/maodie--octane0411-thumb.webp",version:2,tags:["cat","orange-cat","meme","maodie","codex-v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/maodie--octane0411",license:"CC BY 4.0",download:"assets/pets/upstream-20261009/maodie--octane0411.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/maodie--octane0411",spritesheetSha256:"eb819e188df3efc8dc7c0ac11d6533fb01cfe869a56a80835fd44fc6882517d5",metadataNameAlias:!1,authorUrl:"https://github.com/Octane0411"},{id:"nijika--amia",title:"\u8679\u590F",englishTitle:"Nijika Ijichi",description:"\u4F0A\u5730\u77E5\u8679\u590F\u3002\u4E0B\u5317\u6CFD\u5927\u5929\u4F7F\uFF01\u793E\u533A\u4F5C\u8005\uFF1AAmia\u306D",category:"\u52A8\u6F2B\u89D2\u8272",author:"Amia\u306D",authorHandle:"amiaverse",kind:"pet",atlas:"assets/pets/upstream-20261009/nijika--amia.webp",thumbnail:"assets/pets/upstream-20261009/nijika--amia-thumb.webp",version:2,tags:["anime","music","drummer","bocchi-the-rock","fan-art"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/nijika--amia",license:"Non-commercial use and redistribution with attribution to Amia\u306D; original character and design rights remain with their respective owners.",download:"assets/pets/upstream-20261009/nijika--amia.zip",date:"",importedAt:"2026-10-09",collections:["bocchi-the-rock"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/nijika--amia",spritesheetSha256:"85e14504b95e92ea77c362174bb1979a8a067f55a67b1915f33721eaa66451f9",metadataNameAlias:!1,authorUrl:"https://github.com/amiaverse"},{id:"hongmao--legeling",title:"\u8679\u732B\u5C11\u4FA0",englishTitle:"\u8679\u732B\u5C11\u4FA0",description:"A young orange cat swordsman in white martial clothing, a yellow scarf and an orange cape, holding his orange-red sword.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/hongmao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/hongmao--legeling-thumb.webp",version:2,tags:["community-request","v2"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/hongmao--legeling",license:"CC BY-NC 4.0. Non-commercial use only. Commercial use is prohibited. Referenced character and illustration rights remain with their respective owners.",download:"assets/pets/upstream-20261009/hongmao--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/hongmao--legeling",spritesheetSha256:"4022eb2d77c1641c95d548e033aa496a45376f3facc932accf206e62492ac4aa",metadataNameAlias:!0,authorUrl:"https://github.com/legeling"},{id:"jinmao--legeling",title:"\u91D1\u6BDB",englishTitle:"\u91D1\u6BDB",description:"\u4E00\u53EA\u53FC\u7740\u7F51\u7403\u3001\u5782\u7740\u5927\u8033\u6735\u7684\u5976\u6CB9\u6D45\u91D1\u8272\u6CBB\u6108\u7CFB\u91D1\u6BDB\u5E7C\u72AC\u3002",category:"\u52A8\u7269\u4F19\u4F34",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/jinmao--legeling.webp",thumbnail:"assets/pets/upstream-20261009/jinmao--legeling-thumb.webp",version:2,tags:["golden-retriever","dog","puppy","tennis-ball","community-request","ai-generated","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/jinmao--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/jinmao--legeling.zip",date:"",importedAt:"2026-10-09",collections:["animal-companions"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/jinmao--legeling",spritesheetSha256:"1845ef8174a902f72fe269af9e22efff5c2cab9e0bb9aa330a0acb40569a74f6",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"arona--legeling",title:"\u963F\u7F57\u90A3",englishTitle:"\u963F\u7F57\u90A3",description:"\u4E00\u4F4D\u6D45\u84DD\u77ED\u53D1\u3001\u9752\u8272\u5149\u73AF\u4E0E\u6C34\u624B\u670D\u7684 Q \u7248\u6821\u56ED\u4F19\u4F34\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/arona--legeling.webp",thumbnail:"assets/pets/upstream-20261009/arona--legeling-thumb.webp",version:2,tags:["blue-archive","arona","community-request","ai-generated","fan-art","chibi","v2","look-directions"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/arona--legeling",license:"CC BY-NC 4.0\uFF1B\u4EC5\u9650\u975E\u5546\u4E1A\u4F7F\u7528\u3002\u975E\u5B98\u65B9 AI \u540C\u4EBA\u4F5C\u54C1\uFF0C\u4E0D\u4EE3\u8868\u6216\u6697\u793A\u83B7\u5F97\u300A\u78A7\u84DD\u6863\u6848\u300B\u6743\u5229\u65B9\u6388\u6743\uFF1B\u89D2\u8272\u53CA\u5546\u6807\u6743\u5229\u5F52\u5176\u6743\u5229\u4EBA\u6240\u6709\u3002",download:"assets/pets/upstream-20261009/arona--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/arona--legeling",spritesheetSha256:"4140848d8c5cc7831f78d200101910ba831a63a8ad9de6f085b15bcf14bec1d0",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"zayne--legeling",title:"\u9ECE\u6DF1",englishTitle:"Zayne",description:"\u6309\u793E\u533A\u793C\u670D\u53C2\u8003\u5236\u4F5C\u7684\u300A\u604B\u4E0E\u6DF1\u7A7A\u300B\u9ECE\u6DF1 3D Q\u7248\u540C\u4EBA\u5BA0\u7269\uFF0C\u4FDD\u7559\u7EFF\u773C\u3001\u96EA\u82B1\u80F8\u9488\u4E0E\u7EC6\u94FE\u3002AI \u751F\u6210\uFF0C\u975E\u5B98\u65B9\u4F5C\u54C1\u3002",category:"\u6E38\u620F\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/zayne--legeling.webp",thumbnail:"assets/pets/upstream-20261009/zayne--legeling-thumb.webp",version:2,tags:["community-request","love-and-deepspace","chibi-3d"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/zayne--legeling",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/zayne--legeling.zip",date:"",importedAt:"2026-10-09",collections:[],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/zayne--legeling",spritesheetSha256:"e6f9f91eb5a32f240766b96447f4a847f4fdf2b772a9c6a6ac989b6e9ef788aa",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"},{id:"bocchi--lingxiaotian",title:"\u540E\u85E4\u72EC",englishTitle:"Bocchi",description:"A compact Codex digital pet inspired by Bocchi from Bocchi the Rock.",category:"\u52A8\u6F2B\u89D2\u8272",author:"legeling",authorHandle:"legeling",kind:"pet",atlas:"assets/pets/upstream-20261009/bocchi--lingxiaotian.webp",thumbnail:"assets/pets/upstream-20261009/bocchi--lingxiaotian-thumb.webp",version:1,tags:["anime","music","guitar","bocchi-the-rock","pink-hair"],source:"https://github.com/legeling/awesome-codex-pet/tree/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/pets/bocchi--lingxiaotian",license:"CC BY-NC 4.0",download:"assets/pets/upstream-20261009/bocchi--lingxiaotian.zip",date:"",importedAt:"2026-10-09",collections:["bocchi-the-rock"],upstreamCommit:"0d0f06bb1721aef4ddbc7f893276f235ed8458ec",assetsLicenseSource:"https://github.com/legeling/awesome-codex-pet/blob/0d0f06bb1721aef4ddbc7f893276f235ed8458ec/ASSETS-LICENSE.md",assetSource:"upstream-pets/bocchi--lingxiaotian",spritesheetSha256:"d8514dac88d4811c9f238530602f22721f5e2368d5b05238ff906251d457eb72",metadataNameAlias:!1,authorUrl:"https://github.com/legeling"}];var Re=[{id:"lingyin.file-assistant",title:"\u6587\u4EF6\u52A9\u624B",kind:"plugin",pluginType:"host-tool",description:"\u5FEB\u901F\u5B9A\u4F4D\u6587\u4EF6\u3001\u6253\u5F00\u76EE\u5F55\u3001\u865A\u62DF\u5206\u7C7B\u5E93\u4E0E\u53EF\u64A4\u9500\u63A8\u8350\u6574\u7406\uFF1B\u53EF\u4F7F\u7528\u4F60\u914D\u7F6E\u7684 AI \u5BA1\u6838\u5206\u7C7B\u3002",category:"\u53EF\u9009\u5DE5\u5177",author:Q,symbol:"\u6587",version:"1.0.0",sourceFolder:"lingyin-file-assistant",source:"\u672C\u9879\u76EE plugins/community/lingyin-file-assistant",license:"MIT\uFF08\u63D2\u4EF6\u6E05\u5355\u4E0E\u5165\u53E3\u4EE3\u7801\uFF09",download:"assets/lingyin.file-assistant.zip",permissions:["files","status"],permissionLabels:["\u672C\u673A\u6587\u4EF6\u529F\u80FD","\u63D2\u4EF6\u72B6\u6001"],features:["\u8BE2\u95EE\u6587\u4EF6\u4F4D\u7F6E\u5E76\u6253\u5F00\u5BF9\u5E94\u6587\u4EF6\u5939","\u865A\u62DF\u5206\u7C7B\u5E93\u4FDD\u7559\u539F\u4EF6\u4F4D\u7F6E","\u6309\u63A8\u8350\u6574\u7406\u9700\u4E3B\u52A8\u9009\u62E9\uFF0C\u53EF\u6309\u8BB0\u5F55\u64A4\u9500","\u4F7F\u7528\u672C\u5730\u5DF2\u914D\u7F6E\u7684 AI \u5BA1\u6838\u5206\u7C7B"],hostNotice:"\u8FD9\u662F desktop pet \u5BBF\u4E3B\u5DE5\u5177\u63D2\u4EF6\u3002\u5B89\u88C5\u3001\u786E\u8BA4\u6743\u9650\u5E76\u542F\u7528\u540E\uFF0C\u4ECE\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u6574\u7406\u6216\u5220\u9664\u6587\u4EF6\u3002"},{id:"lingyin.computer-care",title:"\u7535\u8111\u5B88\u62A4",kind:"plugin",pluginType:"host-tool",description:"\u5185\u5B58\u3001\u78C1\u76D8\u4E0E\u81EA\u542F\u8BCA\u65AD\u5EFA\u8BAE\uFF0C\u4E0B\u8F7D\u98CE\u9669\u63D0\u9192\u3001\u5B89\u88C5\u5305\u53EA\u8BFB\u68C0\u67E5\u53CA\u5378\u8F7D\u76EE\u5F55\u6838\u5BF9\u3002",category:"\u53EF\u9009\u5DE5\u5177",author:Q,symbol:"\u62A4",version:"1.0.0",sourceFolder:"lingyin-computer-care",source:"\u672C\u9879\u76EE plugins/community/lingyin-computer-care",license:"MIT\uFF08\u63D2\u4EF6\u6E05\u5355\u4E0E\u5165\u53E3\u4EE3\u7801\uFF09",download:"assets/lingyin.computer-care.zip",permissions:["files","system:metrics","status"],permissionLabels:["\u7528\u6237\u9009\u62E9\u7684\u6587\u4EF6\u4E0E\u76EE\u5F55","\u7535\u8111\u8D44\u6E90\u8BFB\u53D6","\u63D2\u4EF6\u72B6\u6001"],features:["\u5185\u5B58\u3001\u78C1\u76D8\u4E0E\u81EA\u542F\u8BCA\u65AD\u53CA\u4FDD\u5B58\u8DEF\u5F84\u7B49\u5EFA\u8BAE","\u7528\u6237\u5F00\u542F\u540E\u63D0\u9192\u53EF\u80FD\u6709\u6346\u7ED1\u98CE\u9669\u7684\u4E0B\u8F7D\u884C\u4E3A","\u9009\u62E9 EXE/MSI \u5B89\u88C5\u5305\u540E\u53EA\u8BFB\u68C0\u67E5\uFF0C\u4E0D\u6267\u884C\u5B89\u88C5","\u6838\u5BF9\u9009\u62E9\u7684\u5378\u8F7D\u76EE\u5F55\uFF0C\u4E0D\u81EA\u52A8\u5378\u8F7D\u6216\u5220\u9664"],hostNotice:"\u8FD9\u662F desktop pet \u5BBF\u4E3B\u5DE5\u5177\u63D2\u4EF6\u3002\u5B89\u88C5\u3001\u786E\u8BA4\u6743\u9650\u5E76\u542F\u7528\u540E\uFF0C\u4ECE\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u8FDB\u5165\uFF1B\u4E0B\u8F7D\u76D1\u6D4B\u7531\u4F60\u5F00\u542F\uFF0C\u98CE\u9669\u63D0\u793A\u4E0D\u4EE3\u8868\u5B89\u88C5\u5305\u5B89\u5168\u4FDD\u8BC1\u3002"}];var _e=[{id:"openpets.reminders",title:"\u5FEB\u901F\u63D0\u9192",description:"\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8BBE\u7F6E\u7B80\u77ED\u7684\u672C\u5730\u63D0\u9192\uFF0C\u5230\u70B9\u65F6\u4F1A\u901A\u8FC7\u58F0\u97F3\u3001\u89D2\u6807\u548C\u53EF\u7A0D\u540E\u63D0\u9192\u7684\u60AC\u6D6E\u6C14\u6CE1\u901A\u77E5\u4F60\u3002",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u63D0",version:"1.2.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.reminders",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.reminders.zip",permissions:["pet:speak","pet:interact","audio","schedule","storage","commands","status","notify"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u7CFB\u7EDF\u63D0\u9192"],features:["\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8BBE\u7F6E\u7B80\u77ED\u7684\u672C\u5730\u63D0\u9192\uFF0C\u5230\u70B9\u65F6\u4F1A\u901A\u8FC7\u58F0\u97F3\u3001\u89D2\u6807\u548C\u53EF\u7A0D\u540E\u63D0\u9192\u7684\u60AC\u6D6E\u6C14\u6CE1\u901A\u77E5\u4F60\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.reminders",sha256:"69f891c89e23c1f7f639a2326b1ff4de18bba19977985a487a3b940b942868cc",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.simple-timer",title:"\u8F7B\u91CF\u8BA1\u65F6\u5668",description:"A one-shot countdown timer with a pet HUD, pause controls, and an expiry alert.",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u65F6",version:"1.1.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.simple-timer",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.simple-timer.zip",permissions:["pet:speak","pet:interact","pet:pin","audio","schedule","storage","commands","status","notify"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u56FA\u5B9A\u6C14\u6CE1","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u7CFB\u7EDF\u63D0\u9192"],features:["A one-shot countdown timer with a pet HUD, pause controls, and an expiry alert.","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.simple-timer",sha256:"a82367cd2e7c15e24171cda2d25e916e0b7cc75675db01cd319d995a7d21d861",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.anxiety-aid-tools",title:"Anxiety Aid Tools",description:"\u56F4\u7ED5\u5BA0\u7269\u8FDB\u884C\u7684\u5E73\u9759\u7EC3\u4E60\uFF1A\u547C\u5438\u3001\u808C\u8089\u653E\u677E\u3001\u7740\u9646\u7EC3\u4E60\u3001\u5F15\u5BFC\u51A5\u60F3\u3001\u610F\u8C61\u653E\u677E\u4E0E\u8212\u7F13\u58F0\u97F3\u3002https://anxietyaidtools.com/ \u7684 desktop pet \u4F34\u4FA3\u3002",kind:"plugin",pluginType:"sdk",category:"\u8EAB\u5FC3\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5FC3",version:"0.1.1",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.anxiety-aid-tools",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.anxiety-aid-tools.zip",permissions:["ui:session","commands","storage","network"],permissionLabels:["\u7EC3\u4E60\u9762\u677F","\u4E3B\u52A8\u547D\u4EE4","\u63D2\u4EF6\u5B58\u6863","\u7F51\u7EDC\u8BBF\u95EE"],features:["\u56F4\u7ED5\u5BA0\u7269\u8FDB\u884C\u7684\u5E73\u9759\u7EC3\u4E60\uFF1A\u547C\u5438\u3001\u808C\u8089\u653E\u677E\u3001\u7740\u9646\u7EC3\u4E60\u3001\u5F15\u5BFC\u51A5\u60F3\u3001\u610F\u8C61\u653E\u677E\u4E0E\u8212\u7F13\u58F0\u97F3\u3002https://anxietyaidtools.com/ \u7684 desktop pet \u4F34\u4FA3\u3002"],sourceFolder:"plugins/official/openpets.anxiety-aid-tools",sha256:"b9b337f47d13b91b607aa5f8b1720540d18090c277a024c18fec90e7bc795c5d",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.focus-buddy",title:"\u4E13\u6CE8\u4F19\u4F34",description:"\u4E00\u4E2A\u5BA0\u7269\u756A\u8304\u949F\u5F0F\u4E13\u6CE8\u8BA1\u65F6\u5668\uFF0C\u5E2E\u4F60\u4E13\u6CE8\uFF0C\u5E76\u63D0\u9192\u4F60\u4F11\u606F\u3002",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u4E13",version:"1.2.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.focus-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.focus-buddy.zip",permissions:["pet:speak","pet:interact","pet:pin","schedule","storage","commands","status","audio"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u56FA\u5B9A\u6C14\u6CE1","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u58F0\u97F3"],features:["\u4E00\u4E2A\u5BA0\u7269\u756A\u8304\u949F\u5F0F\u4E13\u6CE8\u8BA1\u65F6\u5668\uFF0C\u5E2E\u4F60\u4E13\u6CE8\uFF0C\u5E76\u63D0\u9192\u4F60\u4F11\u606F\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.focus-buddy",sha256:"045b99a3bb461de04995a594b569c4bffba201a2ed937e1397fd6af2353d5c37",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.launch-buddy",title:"\u542F\u52A8\u95EE\u5019",description:"\u53CB\u597D\u7684\u542F\u52A8\u95EE\u5019\uFF0C\u5E26\u6709\u6E29\u548C\u7684\u65F6\u673A\u3001\u53CD\u5E94\u548C\u53EF\u9009\u7684\u58F0\u97F3\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5019",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.launch-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.launch-buddy.zip",permissions:["pet:speak","pet:reaction","audio","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u53CB\u597D\u7684\u542F\u52A8\u95EE\u5019\uFF0C\u5E26\u6709\u6E29\u548C\u7684\u65F6\u673A\u3001\u53CD\u5E94\u548C\u53EF\u9009\u7684\u58F0\u97F3\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.launch-buddy",sha256:"26529303d502ec5fa8f14672a91dd80559a022fd81988929341bf1a7453ae60b",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.fortune-cookie",title:"\u6BCF\u65E5\u5E78\u8FD0\u997C\u5E72",description:"\u4E00\u5757\u5C0F\u5C0F\u5E78\u8FD0\u997C\u5E72\u9001\u6765\u7684\u6E29\u67D4\u6BCF\u65E5\u4FBF\u7B7E\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u7B7E",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.fortune-cookie",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.fortune-cookie.zip",permissions:["pet:speak","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u4E00\u5757\u5C0F\u5C0F\u5E78\u8FD0\u997C\u5E72\u9001\u6765\u7684\u6E29\u67D4\u6BCF\u65E5\u4FBF\u7B7E\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.fortune-cookie",sha256:"31785f20974e7921b0def5b88bbcd7a4aa34926cf09b35ec2d9b21297c22bb9f",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.virtual-pet",title:"\u865A\u62DF\u5BA0\u7269",description:"\u7167\u987E\u4E00\u4E2A\u5C0F\u5C0F\u7684\u684C\u9762\u4F19\u4F34\uFF0C\u901A\u8FC7\u6E29\u67D4\u7684\u65E5\u5E38\u4E92\u52A8\u770B\u7740\u4F60\u4EEC\u7684\u7F81\u7ECA\u6210\u957F\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5BA0",version:"1.2.2",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.virtual-pet",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.virtual-pet.zip",permissions:["pet:speak","pet:interact","pet:pin","pet:reaction","schedule","storage","commands","audio","events","bus"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u56FA\u5B9A\u6C14\u6CE1","\u52A8\u4F5C\u53CD\u5E94","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u58F0\u97F3","\u4EA4\u4E92\u4E8B\u4EF6","\u63D2\u4EF6\u534F\u540C"],features:["\u7167\u987E\u4E00\u4E2A\u5C0F\u5C0F\u7684\u684C\u9762\u4F19\u4F34\uFF0C\u901A\u8FC7\u6E29\u67D4\u7684\u65E5\u5E38\u4E92\u52A8\u770B\u7740\u4F60\u4EEC\u7684\u7F81\u7ECA\u6210\u957F\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.virtual-pet",sha256:"36e88d3ab8e4e2aefaf082e424aff83c3c734845a933de7af83c67e4069b8f30",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.life-companion",title:"\u751F\u6D3B\u4F19\u4F34",description:"\u6309\u9700\u5065\u5EB7\u63D0\u9192\u3001\u4E3B\u52A8\u7167\u987E\u548C\u62D6\u62FD\u53CD\u9988\u3002\u968F\u673A\u52A8\u4F5C\u4E0E\u5B89\u9759\u6A21\u5F0F\u5728\u6211\u7684\u684C\u5BA0\u4E2D\u7EDF\u4E00\u914D\u7F6E\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"Lykinzlj",symbol:"\u4F34",version:"1.1.0",source:"\u672C\u9879\u76EE plugins/official/openpets.life-companion",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.life-companion.zip",permissions:["pet:speak","pet:interact","pets:read","schedule","storage","commands","events","bus"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u684C\u5BA0\u72B6\u6001","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u4EA4\u4E92\u4E8B\u4EF6","\u63D2\u4EF6\u534F\u540C"],features:["\u6309\u9700\u5065\u5EB7\u63D0\u9192\u3001\u4E3B\u52A8\u7167\u987E\u548C\u62D6\u62FD\u53CD\u9988\u3002\u968F\u673A\u52A8\u4F5C\u4E0E\u5B89\u9759\u6A21\u5F0F\u5728\u6211\u7684\u684C\u5BA0\u4E2D\u7EDF\u4E00\u914D\u7F6E\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.life-companion",sha256:"630709bdc3ed8f816bf9e963d0cd6b2c4e8f0f6fdc6bcc227999cbf19b7f71ec",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.water-reminder",title:"\u559D\u6C34\u63D0\u9192",description:"\u8BA9\u5BA0\u7269\u6E29\u67D4\u63D0\u9192\u4F60\u559D\u70B9\u6C34\u3002",kind:"plugin",pluginType:"sdk",category:"\u63D0\u9192\u4E0E\u8BA1\u65F6",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6C34",version:"1.0.1",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.water-reminder",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.water-reminder.zip",permissions:["pet:speak","pet:interact","audio","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u58F0\u97F3","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u8BA9\u5BA0\u7269\u6E29\u67D4\u63D0\u9192\u4F60\u559D\u70B9\u6C34\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.water-reminder",sha256:"36da575e91abaa1acb9a3421b6b3712d249ed6e98b15d8c9001ff1f5fc3ba6df",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.system-resources",title:"\u7CFB\u7EDF\u8D44\u6E90",description:"\u5728\u5BA0\u7269\u4E0A\u663E\u793A\u5B9E\u65F6 CPU \u548C\u5185\u5B58\u4EEA\u8868\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 GPU \u548C\u78C1\u76D8\u6307\u6807\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"Karim Bouwmans",symbol:"\u4EEA",version:"2.2.0",source:"https://github.com/OpenPetsHQ/Openpets-system-resources",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.system-resources.zip",permissions:["pet:speak","pet:reaction","pet:pin","schedule","storage","commands","status","events","system:metrics"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u56FA\u5B9A\u6C14\u6CE1","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u4EA4\u4E92\u4E8B\u4EF6","\u53EA\u8BFB\u8D44\u6E90\u6307\u6807"],features:["\u5728\u5BA0\u7269\u4E0A\u663E\u793A\u5B9E\u65F6 CPU \u548C\u5185\u5B58\u4EEA\u8868\uFF0C\u4EE5\u53CA\u53EF\u9009\u7684 GPU \u548C\u78C1\u76D8\u6307\u6807\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.system-resources",sha256:"89adb44a21f900d1ffb72baac8b5ec7deb56b4a19f8219f1c8044941de3ae108",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.calendar-airmail",title:"\u65E5\u5386\u822A\u7A7A\u90AE\u4EF6",description:"\u901A\u8FC7\u6240\u9009\u4FE1\u4F7F\u4EE5\u822A\u7A7A\u90AE\u4EF6\u65B9\u5F0F\u53D1\u9001 Google \u65E5\u5386\u6D3B\u52A8\u63D0\u9192\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u5386",version:"1.2.3",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.calendar-airmail",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.calendar-airmail.zip",permissions:["ui:delivery","auth","network","schedule","storage","commands","status"],permissionLabels:["\u4FE1\u4F7F\u63D0\u9192","\u5916\u90E8\u670D\u52A1\u6388\u6743","\u7F51\u7EDC\u8BBF\u95EE","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001"],features:["\u901A\u8FC7\u6240\u9009\u4FE1\u4F7F\u4EE5\u822A\u7A7A\u90AE\u4EF6\u65B9\u5F0F\u53D1\u9001 Google \u65E5\u5386\u6D3B\u52A8\u63D0\u9192\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.calendar-airmail",sha256:"654b36a22a184833394cdd5eb23e6768bbd422a5556c8c13acb898bbb22420d1",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.day-routine",title:"\u65E9\u665A\u65E5\u5E38",description:"\u6E29\u548C\u7684\u6BCF\u65E5\u966A\u4F34\uFF0C\u548C\u4F60\u7684\u5BA0\u7269\u4E00\u8D77\u5F00\u59CB\u5E76\u6536\u8D77\u4E00\u5929\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6668",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.day-routine",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.day-routine.zip",permissions:["pet:speak","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u6E29\u548C\u7684\u6BCF\u65E5\u966A\u4F34\uFF0C\u548C\u4F60\u7684\u5BA0\u7269\u4E00\u8D77\u5F00\u59CB\u5E76\u6536\u8D77\u4E00\u5929\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.day-routine",sha256:"dba10f72653453d96c6c5f9a54d436a1b14345453211fd17c6c05169db60767d",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.magic-8-ball",title:"\u9B54\u6CD5 8 \u53F7\u7403",description:"\u95EE\u4E00\u4E2A\u8F7B\u677E\u7684\u95EE\u9898\uFF0C\u8BA9\u5BA0\u7269\u7ED9\u4F60\u6E29\u6696\u53C8\u4FCF\u76AE\u7684\u56DE\u7B54\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u7403",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.magic-8-ball",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.magic-8-ball.zip",permissions:["pet:speak","commands","storage"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E3B\u52A8\u547D\u4EE4","\u63D2\u4EF6\u5B58\u6863"],features:["\u95EE\u4E00\u4E2A\u8F7B\u677E\u7684\u95EE\u9898\uFF0C\u8BA9\u5BA0\u7269\u7ED9\u4F60\u6E29\u6696\u53C8\u4FCF\u76AE\u7684\u56DE\u7B54\u3002"],sourceFolder:"plugins/official/openpets.magic-8-ball",sha256:"d18c6c50bdaf6490a94ba95db130a0352c5775b44187170944624ba48549f260",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"openpets.mood-check-in",title:"\u5FC3\u60C5\u7B7E\u5230",description:"\u6BCF\u5929\u4E00\u6B21\u6E29\u548C\u5730\u7559\u610F\u4F60\u5F53\u4E0B\u7684\u611F\u53D7\u3002",kind:"plugin",pluginType:"sdk",category:"\u8EAB\u5FC3\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6674",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/official/openpets.mood-check-in",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.mood-check-in.zip",permissions:["pet:speak","pet:interact","schedule","storage","commands"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u4E92\u52A8\u6C14\u6CE1","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u4E3B\u52A8\u547D\u4EE4"],features:["\u6BCF\u5929\u4E00\u6B21\u6E29\u548C\u5730\u7559\u610F\u4F60\u5F53\u4E0B\u7684\u611F\u53D7\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/official/openpets.mood-check-in",sha256:"3d42c278126f850cd5cfdb8e814b220e84556067f4a361fe22aeb157abed34eb",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002"},{id:"regis.usage-buddy",title:"AI \u989D\u5EA6\u4F19\u4F34",description:"\u4ECE\u53E6\u884C\u8FD0\u884C\u7684\u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\u8BFB\u53D6 Claude\uFF0FCodex \u989D\u5EA6\uFF0C\u5E76\u6309\u914D\u7F6E\u63D0\u9192\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"Regis Benedito dos Santos Bittencourt",symbol:"\u989D",version:"1.1.0",source:"https://github.com/regisbsb/openpets-plugin-usage-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/regis.usage-buddy.zip",permissions:["pet:speak","pet:reaction","commands","status","schedule","network","network:local","storage"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u5B9A\u65F6\u8C03\u5EA6","\u7F51\u7EDC\u8BBF\u95EE","\u672C\u673A\u7F51\u7EDC","\u63D2\u4EF6\u5B58\u6863"],features:["\u4ECE\u53E6\u884C\u8FD0\u884C\u7684\u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\u8BFB\u53D6 Claude\uFF0FCodex \u989D\u5EA6\uFF0C\u5E76\u6309\u914D\u7F6E\u63D0\u9192\u3002","\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C usage-monitor-for-claude-and-codex \u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\uFF0C\u5E76\u786E\u8BA4\u63D2\u4EF6\u53EF\u8BBF\u95EE\u5176 127.0.0.1:45455 \u7AEF\u70B9\uFF1B\u63D2\u4EF6\u672C\u8EAB\u4E0D\u76F4\u63A5\u8BFB\u53D6\u4E91\u7AEF\u8D26\u53F7\u989D\u5EA6\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/regis.usage-buddy",sha256:"48e03c6b788e610e76a7ae4241e4c26bab9627171d8565a21524ea4e57feb9d0",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C usage-monitor-for-claude-and-codex \u672C\u673A\u76D1\u63A7\u7A0B\u5E8F\uFF0C\u5E76\u786E\u8BA4\u63D2\u4EF6\u53EF\u8BBF\u95EE\u5176 127.0.0.1:45455 \u7AEF\u70B9\uFF1B\u63D2\u4EF6\u672C\u8EAB\u4E0D\u76F4\u63A5\u8BFB\u53D6\u4E91\u7AEF\u8D26\u53F7\u989D\u5EA6\u3002"},{id:"openpets.higgsfield-watch",title:"Higgsfield \u8FDB\u5EA6\u4F19\u4F34",description:"\u914D\u7F6E\u81EA\u5DF1\u7684 Higgsfield \u4EE4\u724C\u540E\uFF0C\u8BA9\u684C\u5BA0\u62A5\u544A\u56FE\u50CF\u4E0E\u89C6\u9891\u751F\u6210\u8FDB\u5EA6\u3002",kind:"plugin",pluginType:"sdk",category:"\u8D44\u6E90\u4E0E\u5DE5\u5177",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u7ED8",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.higgsfield-watch",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.higgsfield-watch.zip",permissions:["network","schedule","storage","pet:speak","pet:reaction","commands","status"],permissionLabels:["\u7F51\u7EDC\u8BBF\u95EE","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001"],features:["\u914D\u7F6E\u81EA\u5DF1\u7684 Higgsfield \u4EE4\u724C\u540E\uFF0C\u8BA9\u684C\u5BA0\u62A5\u544A\u56FE\u50CF\u4E0E\u89C6\u9891\u751F\u6210\u8FDB\u5EA6\u3002","\u9700\u8981\u7528\u6237\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u586B\u5199\u81EA\u5DF1\u7684 Higgsfield \u8BBF\u95EE\u4EE4\u724C\uFF0C\u63D2\u4EF6\u4EC5\u5411\u58F0\u660E\u7684 Higgsfield \u670D\u52A1\u67E5\u8BE2\u751F\u6210\u8FDB\u5EA6\uFF1B\u7F51\u7AD9\u4E0D\u63A5\u6536\u4EE4\u724C\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.higgsfield-watch",sha256:"31d3c85dc20396faa78311a0b2180bf927a5b65db1bd149fbe8f348fd670bda9",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u9700\u8981\u7528\u6237\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u586B\u5199\u81EA\u5DF1\u7684 Higgsfield \u8BBF\u95EE\u4EE4\u724C\uFF0C\u63D2\u4EF6\u4EC5\u5411\u58F0\u660E\u7684 Higgsfield \u670D\u52A1\u67E5\u8BE2\u751F\u6210\u8FDB\u5EA6\uFF1B\u7F51\u7AD9\u4E0D\u63A5\u6536\u4EE4\u724C\u3002"},{id:"openpets.drag-vocab",title:"\u62D6\u62FD\u8BCD\u6C47\u52A9\u624B",description:"\u62D6\u5165\u8BCD\u6C47\u67E5\u770B\u7F51\u7EDC\u91CA\u4E49\u4E0E\u7FFB\u8BD1\uFF1B\u8FDE\u63A5 AnkiConnect \u540E\u53EF\u9009\u4FDD\u5B58\u5355\u8BCD\u5361\u3002",kind:"plugin",pluginType:"sdk",category:"\u5B66\u4E60\u4E0E\u6548\u7387",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u8BCD",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.drag-vocab",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.drag-vocab.zip",permissions:["pet:speak","pet:drop","network","events","pet:reaction","pet:interact","network:local","network:write"],permissionLabels:["\u684C\u5BA0\u53F0\u8BCD","\u62D6\u5165\u6587\u672C","\u7F51\u7EDC\u8BBF\u95EE","\u4EA4\u4E92\u4E8B\u4EF6","\u52A8\u4F5C\u53CD\u5E94","\u4E92\u52A8\u6C14\u6CE1","\u672C\u673A\u7F51\u7EDC","\u7F51\u7EDC\u5199\u5165"],features:["\u62D6\u5165\u8BCD\u6C47\u67E5\u770B\u7F51\u7EDC\u91CA\u4E49\u4E0E\u7FFB\u8BD1\uFF1B\u8FDE\u63A5 AnkiConnect \u540E\u53EF\u9009\u4FDD\u5B58\u5355\u8BCD\u5361\u3002","\u91CA\u4E49\u4E0E\u7FFB\u8BD1\u9700\u8981\u7F51\u7EDC\u8BBF\u95EE\u3002\u4FDD\u5B58\u5355\u8BCD\u5230 Anki \u4E3A\u53EF\u9009\u64CD\u4F5C\uFF0C\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C Anki \u4E0E AnkiConnect\uFF0C\u5E76\u9009\u62E9\u5BF9\u5E94\u724C\u7EC4\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.drag-vocab",sha256:"71356efce07269de28ac918c96320d6bbb558cdfd8f73176b91d2c16910ccad4",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u91CA\u4E49\u4E0E\u7FFB\u8BD1\u9700\u8981\u7F51\u7EDC\u8BBF\u95EE\u3002\u4FDD\u5B58\u5355\u8BCD\u5230 Anki \u4E3A\u53EF\u9009\u64CD\u4F5C\uFF0C\u9700\u8981\u7528\u6237\u53E6\u884C\u8FD0\u884C Anki \u4E0E AnkiConnect\uFF0C\u5E76\u9009\u62E9\u5BF9\u5E94\u724C\u7EC4\u3002"},{id:"openpets.spotify-buddy",title:"Spotify \u97F3\u4E50\u4F19\u4F34",description:"\u914D\u7F6E Spotify \u5E94\u7528 ID \u5E76\u6388\u6743\u8D26\u53F7\u540E\uFF0C\u8BA9\u684C\u5BA0\u966A\u542C\u3001\u62A5\u544A\u66F2\u76EE\u4E0E\u63A7\u5236\u64AD\u653E\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u4E50",version:"1.8.1",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.spotify-buddy",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.spotify-buddy.zip",permissions:["network","network:write","schedule","storage","pet:speak","pet:reaction","commands","status","auth","secrets","ui:toast"],permissionLabels:["\u7F51\u7EDC\u8BBF\u95EE","\u7F51\u7EDC\u5199\u5165","\u5B9A\u65F6\u8C03\u5EA6","\u63D2\u4EF6\u5B58\u6863","\u684C\u5BA0\u53F0\u8BCD","\u52A8\u4F5C\u53CD\u5E94","\u4E3B\u52A8\u547D\u4EE4","\u8FD0\u884C\u72B6\u6001","\u5916\u90E8\u670D\u52A1\u6388\u6743","\u672C\u673A\u79D8\u5BC6\u5B58\u50A8","\u72B6\u6001\u63D0\u793A"],features:["\u914D\u7F6E Spotify \u5E94\u7528 ID \u5E76\u6388\u6743\u8D26\u53F7\u540E\uFF0C\u8BA9\u684C\u5BA0\u966A\u542C\u3001\u62A5\u544A\u66F2\u76EE\u4E0E\u63A7\u5236\u64AD\u653E\u3002","\u9700\u8981\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u63D0\u4F9B\u53EF\u7528\u7684 Spotify \u5E94\u7528 Client ID\uFF0C\u518D\u901A\u8FC7\u63D2\u4EF6\u547D\u4EE4\u5B8C\u6210\u8D26\u53F7\u6388\u6743\uFF1B\u5F53\u524D\u6E90\u7801\u4F7F\u7528\u5BBF\u4E3B OAuth\uFF0C\u4E0D\u8981\u6C42\u65E7 README \u4E2D\u7684 ngrok \u6865\u63A5\u3002\u64AD\u653E\u63A7\u5236\u8FD8\u53D7 Spotify \u8D26\u53F7\u548C\u670D\u52A1\u6743\u9650\u9650\u5236\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.spotify-buddy",sha256:"74558f32294d028f20eb8de0993845eaf08bbb47ae60ee59b2b3288be5f99e4b",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u9700\u8981\u5728\u672C\u673A\u63D2\u4EF6\u914D\u7F6E\u63D0\u4F9B\u53EF\u7528\u7684 Spotify \u5E94\u7528 Client ID\uFF0C\u518D\u901A\u8FC7\u63D2\u4EF6\u547D\u4EE4\u5B8C\u6210\u8D26\u53F7\u6388\u6743\uFF1B\u5F53\u524D\u6E90\u7801\u4F7F\u7528\u5BBF\u4E3B OAuth\uFF0C\u4E0D\u8981\u6C42\u65E7 README \u4E2D\u7684 ngrok \u6865\u63A5\u3002\u64AD\u653E\u63A7\u5236\u8FD8\u53D7 Spotify \u8D26\u53F7\u548C\u670D\u52A1\u6743\u9650\u9650\u5236\u3002"},{id:"openpets.walkabout",title:"\u684C\u9762\u6F2B\u6B65",description:"\u6279\u51C6\u79FB\u52A8\u6743\u9650\u540E\uFF0C\u8BA9\u684C\u5BA0\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002",kind:"plugin",pluginType:"sdk",category:"\u751F\u6D3B\u966A\u4F34",author:"Lykinzlj",authorRole:"maintainer",originalAuthor:"OpenPets contributors",symbol:"\u6B65",version:"1.0.0",source:"https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/plugins/community/openpets.walkabout",license:"MIT\uFF1B\u539F\u59CB\u7248\u6743\u58F0\u660E\u89C1\u5305\u5185 LICENSE",download:"assets/openpets.walkabout.zip",permissions:["pet:move","events","pets:read","status"],permissionLabels:["\u684C\u5BA0\u79FB\u52A8","\u4EA4\u4E92\u4E8B\u4EF6","\u684C\u5BA0\u72B6\u6001","\u8FD0\u884C\u72B6\u6001"],features:["\u6279\u51C6\u79FB\u52A8\u6743\u9650\u540E\uFF0C\u8BA9\u684C\u5BA0\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002","\u542F\u7528\u540E\u4F1A\u6309\u914D\u7F6E\u79FB\u52A8\u684C\u5BA0\uFF0C\u9700\u8981\u6279\u51C6\u684C\u5BA0\u79FB\u52A8\u6743\u9650\uFF1B\u53EF\u9009\u62E9\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002","\u5728\u672C\u5730\u63D2\u4EF6\u914D\u7F6E\u4E2D\u8C03\u6574\u9009\u9879\uFF0C\u7F51\u7AD9\u4E0B\u8F7D\u4E0D\u4F1A\u6539\u53D8\u5DF2\u6709\u914D\u7F6E\u3002"],sourceFolder:"plugins/community/openpets.walkabout",sha256:"6d5622f9eaf0906e591ca796b504157effe00c88c023286f7f38db2ab8d381de",hostNotice:"\u8FD9\u662F\u5728 desktop pet \u672C\u673A\u8FD0\u884C\u7684\u63D2\u4EF6\u3002\u4E0B\u8F7D ZIP \u5E76\u89E3\u538B\uFF0C\u5BFC\u5165\u542B\u63D2\u4EF6\u6E05\u5355\u7684\u6587\u4EF6\u5939\u540E\u786E\u8BA4\u6743\u9650\uFF1B\u542F\u505C\u3001\u914D\u7F6E\u3001\u6388\u6743\u548C\u63D2\u4EF6\u6570\u636E\u4ECD\u7531\u672C\u5730\u63A7\u5236\u4E2D\u5FC3\u7BA1\u7406\u3002",requirements:"\u542F\u7528\u540E\u4F1A\u6309\u914D\u7F6E\u79FB\u52A8\u684C\u5BA0\uFF0C\u9700\u8981\u6279\u51C6\u684C\u5BA0\u79FB\u52A8\u6743\u9650\uFF1B\u53EF\u9009\u62E9\u968F\u673A\u6F2B\u6B65\u3001\u8DDF\u968F\u9F20\u6807\u6216\u5F80\u8FD4\u5DE1\u6E38\u3002"}];var X=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/,su=new TextEncoder,L=class extends Error{constructor(t,u=400){super(t),this.status=u}};function R(e,t=200,u={}){return Response.json(e,{status:t,headers:{"cache-control":"no-store","x-content-type-options":"nosniff",...u}})}function pe(e){if(typeof e!="string"||!e||e.length>120||e!==e.trim()||/[\u0000-\u001f\u007f]/u.test(e))throw new L("\u4F5C\u8005\u540D\u79F0\u65E0\u6548\u3002");return e}async function nu(e){let t=await crypto.subtle.digest("SHA-256",su.encode(e));return Array.from(new Uint8Array(t),u=>u.toString(16).padStart(2,"0")).join("")}async function ou(e){if(!/^application\/json(?:\s*;|$)/i.test(e.headers.get("content-type")||""))throw new L("\u8BF7\u53D1\u9001 JSON \u5185\u5BB9\u3002",415);if(Number(e.headers.get("content-length")||0)>1024)throw new L("\u5185\u5BB9\u8FC7\u5927\u3002",413);let t=e.body?.getReader();if(!t)throw new L("\u7F3A\u5C11\u64CD\u4F5C\u5185\u5BB9\u3002");let u=0,a="",i=new TextDecoder("utf-8",{fatal:!0}),n=setTimeout(()=>{t.cancel().catch(()=>{})},5e3);try{for(;;){let o=await t.read();if(o.done)break;if(u+=o.value.length,u>1024)throw await t.cancel(),new L("\u5185\u5BB9\u8FC7\u5927\u3002",413);a+=i.decode(o.value,{stream:!0})}let s=JSON.parse(a+i.decode());if(!s||typeof s!="object"||Array.isArray(s))throw new L("\u64CD\u4F5C\u5185\u5BB9\u65E0\u6548\u3002");return s}catch(s){throw s instanceof L?s:new L("\u64CD\u4F5C\u5185\u5BB9\u65E0\u6548\u3002")}finally{clearTimeout(n),t.releaseLock()}}function Ye({DB:e,origin:t,salt:u,works:a=[],now:i=Date.now}){let n=new URL(t);if(n.protocol!=="https:"||n.origin!==t||n.username||n.password)throw new Error("\u533F\u540D\u4E92\u52A8\u5FC5\u987B\u4F7F\u7528\u56FA\u5B9A HTTPS \u4E3B\u7AD9\u3002");if(!e?.prepare||!e?.batch)throw new Error("\u533F\u540D\u4E92\u52A8\u672A\u7ED1\u5B9A D1\u3002");if(typeof u!="string"||u.length<32||u.length>256)throw new Error("\u533F\u540D\u4E92\u52A8\u6458\u8981\u79D8\u5BC6\u5C1A\u672A\u914D\u7F6E\u3002");if(typeof i!="function"||!Array.isArray(a)||a.length>5e3)throw new Error("\u533F\u540D\u4E92\u52A8\u521D\u59CB\u5316\u65E0\u6548\u3002");let s=new Map;for(let m of a){if(!m||!X.test(m.id)||["__proto__","constructor","prototype"].includes(m.id))throw new Error("\u5185\u7F6E\u4F5C\u54C1\u6807\u8BC6\u65E0\u6548\u3002");let y=pe(m.author);if(s.has(m.id)&&s.get(m.id).author!==y)throw new Error("\u5185\u7F6E\u4F5C\u54C1\u6807\u8BC6\u91CD\u590D\u3002");s.set(m.id,{id:m.id,author:y})}let o=0;function r(){let m=i();if(!Number.isSafeInteger(m)||m<0)throw new Error("\u4E92\u52A8\u65F6\u95F4\u65E0\u6548\u3002");return m}function c(m){if(typeof m!="string"||!m||m==="unknown"||m.length>128||/[\s\u0000-\u001f\u007f]/u.test(m))throw new L("\u6682\u65F6\u65E0\u6CD5\u53D6\u5F97\u533F\u540D\u4E92\u52A8\u6765\u6E90\u3002",503);return m}async function l(m){for(let y of s.values())if(y.author===m)return!0;return!!await e.prepare("SELECT 1 AS found FROM community_pets WHERE author = ? UNION ALL SELECT 1 AS found FROM community_plugins WHERE author = ? LIMIT 1").bind(m,m).first()}async function b(m){return s.has(m)?!0:!!await e.prepare("SELECT 1 AS found FROM community_pets WHERE id = ? UNION ALL SELECT 1 AS found FROM community_plugins WHERE id = ? LIMIT 1").bind(m,m).first()}async function d(m,y,E){return nu(JSON.stringify([u,y,E,m]))}async function g(m){let y=r(),E=Math.floor(y/36e5),D=await d(m,"write-rate",E),v=(await e.batch([e.prepare("DELETE FROM community_interaction_limits WHERE expires_at <= ?").bind(y),e.prepare(`INSERT INTO community_interaction_limits (key_hash, count, expires_at)
        SELECT ?, 1, ? WHERE EXISTS (SELECT 1 FROM community_interaction_limits WHERE key_hash = ?)
          OR (SELECT COUNT(*) FROM community_interaction_limits) < 4096
        ON CONFLICT(key_hash) DO UPDATE SET count = MIN(community_interaction_limits.count + 1, ?)
        RETURNING count`).bind(D,(E+2)*36e5,D,61)]))[1]?.results?.[0]?.count;if(!Number.isSafeInteger(v)||v>60)throw new L("\u4E92\u52A8\u64CD\u4F5C\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",429)}async function h(m,y){let E=await d(y,"creator-follow",m),D=await e.prepare("SELECT COUNT(*) AS followers, MAX(CASE WHEN actor_hash = ? THEN 1 ELSE 0 END) AS following FROM community_creator_follows WHERE author = ?").bind(E,m).first();return{available:!0,followers:Number(D?.followers||0),following:D?.following===1}}async function z(m){let y=new Date(r()-6048e5).toISOString(),[E,D,N,v]=await Promise.all([e.prepare("SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_likes GROUP BY work_id").bind(y).all(),e.prepare("SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_downloads GROUP BY work_id").bind(y).all(),e.prepare("SELECT author, COUNT(*) AS followers FROM community_creator_follows GROUP BY author").all(),e.prepare("SELECT author FROM community_pets UNION SELECT author FROM community_plugins").all()]),w=E.results.map(C=>C.work_id).filter(C=>X.test(C)&&!["__proto__","constructor","prototype"].includes(C)),I=await Promise.all(w.map(C=>d(m,"like",C))),S=new Set;for(let C=0;C<I.length;C+=64){let f=I.slice(C,C+64),k=await e.prepare(`SELECT work_id FROM community_likes WHERE actor IN (${f.map(()=>"?").join(",")})`).bind(...f).all();for(let U of k.results)S.add(U.work_id)}let A=Object.create(null);for(let[C,f]of[[E.results,"likes"],[D.results,"downloads"]])for(let k of C){if(!X.test(k.work_id)||["__proto__","constructor","prototype"].includes(k.work_id))continue;let U=A[k.work_id]||={likes:0,downloads:0,weekly:0,weeklyLikes:0,weeklyDownloads:0,liked:S.has(k.work_id)};U[f]=Number(k.total);let Z=Number(k.week||0);U[f==="likes"?"weeklyLikes":"weeklyDownloads"]=Z,U.weekly+=Z}let B=Object.create(null);for(let C of[...s.values(),...v.results])try{B[pe(C.author)]={followers:0}}catch{}for(let C of N.results)Object.hasOwn(B,C.author)&&(B[C.author].followers=Number(C.followers));return{items:A,contributors:B,scope:"site",downloadRule:"\u540C\u4E00\u6D4F\u89C8\u5668\u6BCF\u5929\u5BF9\u540C\u4E00\u4F5C\u54C1\u8BA1\u4E00\u6B21\u4E0B\u8F7D\uFF1B\u70B9\u8D5E\u6309\u533F\u540D\u6765\u6E90\u548C\u4F5C\u54C1\u53BB\u91CD"}}async function j(m,y){let E=new URL(m.url),D=/^\/api\/contributors\/([^/]{1,2048})$/.exec(E.pathname),N=/^\/api\/works\/([a-zA-Z0-9._-]{1,80})\/like$/.exec(E.pathname),v=E.pathname==="/api/activity";if(!D&&!N&&!v)return null;try{if(E.origin!==t)throw new L("\u8BF7\u5728\u6B63\u5F0F\u5171\u521B\u5E73\u53F0\u64CD\u4F5C\u3002",403);let w=c(y),I=v?["GET"]:D?["GET","PUT"]:["POST"];if(!I.includes(m.method))return R({error:"\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C\u3002"},405,{allow:I.join(", ")});if(m.method!=="GET"&&(m.headers.get("origin")!==t||m.headers.get("sec-fetch-site")==="cross-site"))throw new L("\u8BF7\u5728\u672C\u7AD9\u53D1\u8D77\u4E92\u52A8\u3002",403);let S;if(D){try{S=pe(decodeURIComponent(D[1]))}catch{throw new L("\u4F5C\u8005\u540D\u79F0\u65E0\u6548\u3002")}if(!["pets","plugins"].includes(E.searchParams.get("kind")||"pets"))throw new L("\u4F5C\u8005\u4F5C\u54C1\u7C7B\u578B\u65E0\u6548\u3002");if(!await l(S))throw new L("\u4F5C\u8005\u4E0D\u5B58\u5728\u3002",404)}if(N&&(!X.test(N[1])||["__proto__","constructor","prototype"].includes(N[1])||!await b(N[1])))throw new L("\u4F5C\u54C1\u4E0D\u5B58\u5728\u3002",404);if(v)return R(await z(w));if(m.method==="GET")return R(await h(S,w));if(o>=16)throw new L("\u4E92\u52A8\u8BF7\u6C42\u8F83\u591A\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",503);o++;let A;try{A=await ou(m)}finally{o--}let B=D?"following":"liked";if(typeof A[B]!="boolean"||Object.keys(A).some(k=>k!==B))throw new L("\u4E92\u52A8\u72B6\u6001\u65E0\u6548\u3002");if(await g(w),D){let k=await d(w,"creator-follow",S),U=A.following?e.prepare("INSERT INTO community_creator_follows (author, actor_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(author, actor_hash) DO NOTHING").bind(S,k,new Date(r()).toISOString()):e.prepare("DELETE FROM community_creator_follows WHERE author = ? AND actor_hash = ?").bind(S,k),Z=await e.batch([U,e.prepare("SELECT COUNT(*) AS followers, MAX(CASE WHEN actor_hash = ? THEN 1 ELSE 0 END) AS following FROM community_creator_follows WHERE author = ?").bind(k,S)]),me=Z[1].results[0];return R({available:!0,followers:Number(me.followers),following:me.following===1,changed:Number(Z[0].meta?.changes||0)>0})}let C=N[1],f=await d(w,"like",C);return A.liked?await e.prepare("INSERT INTO community_likes (id, work_id, actor, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(work_id, actor) DO NOTHING").bind(crypto.randomUUID(),C,f,new Date(r()).toISOString()).run():await e.prepare("DELETE FROM community_likes WHERE work_id = ? AND actor = ?").bind(C,f).run(),R(await z(w))}catch(w){return w instanceof L?R({error:w.message},w.status,w.status===429?{"retry-after":"3600"}:{}):R({error:"\u516C\u5171\u4E92\u52A8\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002"},503)}}return{handle:j}}var We="https://desktoppet-e9e.pages.dev",ru=[...qe,...Re,..._e,...Me.map(e=>({...e,author:Q}))],_=(e,t=200)=>Response.json(e,{status:t,headers:{"cache-control":"no-store"}});function lu(e=Ye){let t=new WeakMap;return{async fetch(u,a){let i=new URL(u.url);if(!i.pathname.startsWith("/api/"))return a.ASSETS.fetch(u);if(i.origin!==We)return _({error:"\u8BF7\u4F7F\u7528\u6B63\u5F0F\u5171\u521B\u5E73\u53F0\u5730\u5740\u3002"},403);let n=new Headers(u.headers);n.delete("oai-authenticated-user-id"),n.delete("oai-sites-authorization"),n.delete("x-forwarded-for");let s=new Request(u,{headers:n}),o=!!e&&!!a.DB&&typeof a.HASH_SALT=="string"&&a.HASH_SALT.length>=32;try{let r;if(o){let l=t.get(a.DB);(!l||l.salt!==a.HASH_SALT)&&(l={salt:a.HASH_SALT,service:Promise.resolve().then(()=>e({DB:a.DB,origin:We,salt:a.HASH_SALT,works:ru}))},t.set(a.DB,l));try{r=await l.service}catch(b){throw t.get(a.DB)===l&&t.delete(a.DB),b}}if(i.pathname.startsWith("/api/auth/"))return i.pathname==="/api/auth/session"&&u.method==="GET"?_({user:null,available:!1}):_({error:"\u5BC6\u7801\u767B\u5F55\u5DF2\u505C\u7528\u3002"},503);if(i.pathname==="/api/session"&&u.method==="GET"){let l=!1;if(r)try{await a.DB.batch(["community_creator_follows","community_interaction_limits","community_likes","community_downloads"].map(b=>a.DB.prepare(`SELECT 1 FROM ${b} LIMIT 0`))),l=!0}catch{}return _({available:!1,signedIn:!1,maxPackageBytes:32*1024*1024,interactionsAvailable:l,anonymousInteractions:l,error:"\u8BF7\u914D\u7F6E\u6295\u7A3F\u4ED3\u5E93\u3002"})}if(["/api/plugins","/api/pets","/api/requests"].includes(i.pathname)&&u.method==="POST")return _({error:"\u8BF7\u914D\u7F6E\u6295\u7A3F\u4ED3\u5E93\u3002"},401);let c=u.headers.get("cf-connecting-ip")||"unknown";if(r){let l=await r.handle(s,c);if(l)return l}else if(i.pathname.startsWith("/api/contributors/")||/^\/api\/works\/[^/]+\/like$/.test(i.pathname))return _({error:"\u516C\u5171\u4E92\u52A8\u5C1A\u672A\u542F\u7528\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002"},503);return await Oe.fetch(s,a)}catch(r){return console.error("\u5171\u521B\u5E73\u53F0\u8BF7\u6C42\u5931\u8D25",r?.name),_({error:"\u516C\u5171\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002"},503)}}}}var Du=lu();export{lu as createWorker,Du as default};
