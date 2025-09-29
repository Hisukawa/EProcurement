import{c}from"./createLucideIcon-B5xgoSjl.js";import{j as t}from"./app-z2zUCIH2.js";import{N as n}from"./Dropdown-DTp9JO5b.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"M9 14 4 9l5-5",key:"102s5s"}],["path",{d:"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",key:"f3b9sd"}]],m=c("undo-2",i);function p({pr:r}){const o=[{label:"AOQ - As Read",routeName:"bac_approver.abstract_of_quotations"},{label:"AOQ - As Calculated",routeName:"bac_approver.abstract_of_quotations_calculated"}];return t.jsx("div",{className:"w-full mx-auto mb-6",children:t.jsx("div",{className:"flex bg-white rounded-lg shadow overflow-hidden border border-gray-300",children:o.map(e=>{const s=route(e.routeName,r),a=route().current(e.routeName);return t.jsx(n,{href:s,active:a,className:`flex-1 flex items-center justify-center text-center px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors duration-200 ${a?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-100"}`,children:e.label},e.label)})})})}export{p as A,m as U};
