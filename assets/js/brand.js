/* Bundled brand assets with graceful fallback. Replace logo.svg to update the mark. */
(function(){
  document.querySelectorAll('img[data-brand]').forEach(function(node){
    function fail(){ var holder=node.closest('.wordmark'); if(holder) holder.classList.add('no-logo'); }
    node.addEventListener('error',fail);
    if(node.complete && !node.naturalWidth) fail();
  });
})();
