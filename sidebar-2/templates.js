/*
*   templates.js
*/

const styleTmpl = `
<style>
  #button-1 {
    color: blue;
  }
  #button-2 {
    color: green;
  }
  div[role="tabpanel"] {
    height: 100px;
    border: 1px solid #ddd;
    padding: 5px;
  }
  .is-hidden {
    display: none;
  }
</style>
`

const htmlTmpl = `
<div class="tabset">
  <div role="tablist">
    <button role="tab" type="button" id="button-1" aria-controls="panel-1" aria-selected="true" tabindex="-1">
      <slot name="button-1"></slot>
    </button>
    <button role="tab" type="button" id="button-2" aria-controls="panel-2" aria-selected="false" tabindex="-1">
      <slot name="button-2"></slot>
    </button>
  </div>
  <div role="tabpanel" id="panel-1" aria-labelledby="button-1" tabindex="0">
    <slot name="panel-1"></slot>
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="button-2" tabindex="0" class="is-hidden">
    <slot name="panel-2"></slot>
  </div>
</div>
`
export { styleTmpl, htmlTmpl };
