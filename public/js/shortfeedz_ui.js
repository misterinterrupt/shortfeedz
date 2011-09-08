// constructor with properties
var shortfeedz = function (){
  this.accountStreamRoutes = {
    create : 'account/stream',
    get : '/account/stream',
    save : 'account/stream',
    update : '/account/stream',
    del: '/account/stream'
  };
  this.termsSelector = 'ul#streams li p span.terms';
};

/* 
 * add click handler to all terms
 * user should be able to click and edit the terms
 * terms should update in the background on blur 
 * or upon press of enter key
 */
shortfeedz.prototype.init = function () {
  $(this.termsSelector).click(this.termsClickHandler);
}

shortfeedz.prototype.termsClickHandler = function (ev) {
  var self = $(this),
      inputNode = $("<input type='text'></input>");
  self.unbind('click', ShortFeedz.termsClickHandler);
  // put the original value into the input
  inputNode.attr('value', self.html());
  inputNode.focusout(ShortFeedz.termsEditedHandler);
  inputNode.keypress(ShortFeedz.termsEditedHandler);
  self.wrapInner(inputNode);
  self.children('input').first().focus();
}

shortfeedz.prototype.termsEditedHandler = function (ev) {
  if (ev.which == 13) {
    ev.preventDefault();
  } else if (typeof ev.which !== 'undefined') {
    return;
  }
  var inputNode = $(this),
      newVal = inputNode.val(),
      termsSpan = inputNode.parent();
  
  inputNode.unbind('focusout', this.termsEditedHandler);
  inputNode.unbind('keypress', this.termsEditedHandler);

  // validate for lack of terms
  
  termsSpan.html(newVal);
  termsSpan.click(ShortFeedz.termsClickHandler);
}

$(function pageload () {
  ShortFeedz = new shortfeedz();
  ShortFeedz.init();
});