/*
*   templates.js
*/

export const htmlTmpl = `
<div class="tabset">
  <div role="tablist">
    <button role="tab" type="button" id="tab-1" aria-controls="panel-1" aria-selected="true" tabindex="-1">
      <slot name="tab-1"></slot>
    </button>
    <button role="tab" type="button" id="tab-2" aria-controls="panel-2" aria-selected="false" tabindex="-1">
      <slot name="tab-2"></slot>
    </button>
  </div>
  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0">
    <slot name="panel-1"></slot>
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" tabindex="0" class="is-hidden">
    <slot name="panel-2"></slot>
  </div>
</div>
`
