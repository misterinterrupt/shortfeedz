// constructor with properties
var shortfeedz = function (){
  this.accountStreamRoutes = {
    create : 'account/stream', // post
    get : '/account/stream/', // get
    update : '/account/stream/', // put
    del: '/account/stream/' // delete
  };
  this.termsSelector = 'ul#streams li p span.terms';
  this.streamDeleteSelector = 'ul#streams li p span.delete';
};

/* 
 * add click handler to all terms
 * user should be able to click and edit the terms
 * terms should update in the background on blur 
 * or upon press of enter key
 */
shortfeedz.prototype.init = function () {
  $(this.termsSelector).click(this.termsClickHandler);
  $(this.streamDeleteSelector).click(this.streamDeleteHandler);
}

shortfeedz.prototype.termsClickHandler = function (ev) {

  var self = $(this),
      inputNode = $("<input type='text'></input>"),
      oldVal = self.html(),
      history = [];
  // remove the listener that got us here
  self.unbind('click', ShortFeedz.termsClickHandler);
  
  // save the old value in $.data in case we need it upon server error
  if($.hasData(self[0])) {
    var histData = $.data(self[0],'history');
    if(typeof histData.length !== 'undefined') {
      history = histData;
    }
  }
  history.push(oldVal);
  $.data(self[0], 'history', history);
  // put the original value into the input
  inputNode.attr('value', self.html());
  // set the input up for expected interactions
  inputNode.focusout(ShortFeedz.termsEditedHandler);
  inputNode.keypress(ShortFeedz.termsEditedHandler);
  // now show and focus on the input
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
      termsSpan = inputNode.parent(),
      streamId = termsSpan.attr('id');
  
  // remove the listeners that got us here
  inputNode.unbind('focusout', this.termsEditedHandler);
  inputNode.unbind('keypress', this.termsEditedHandler);

  // TODO:: validate for lack of terms, empty strings
  // update terms on the backend
  $.ajax({
    url: ShortFeedz.accountStreamRoutes.update + streamId,
    type: 'PUT',
    data: {'terms' : newVal},
    success: function(data) {
      termsSpan.html(newVal);
      termsSpan.click(ShortFeedz.termsClickHandler);
      var lips = $('li#stream-' + streamId + ' p');
      console.log(data);
      lips.filter('.updated').html('updated: ' + data.updatedAt);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      // TODO:: throw up a little message explaining why the word won't save like it should ;)
      var oldVal = $.data(termsSpan[0], 'history').pop();
      termsSpan.html(oldVal);
      termsSpan.click(ShortFeedz.termsClickHandler);
    }
  });
}


// to delete a stream, click the little [x]
shortfeedz.prototype.streamDeleteHandler = function (ev) {
  
  var deleteButton = $(this),
      streamId = deleteButton.siblings('.terms').attr('id'),
      listItem = deleteButton.parent().parent();
  
  $.ajax({
    url: ShortFeedz.accountStreamRoutes.del + streamId,
    type: 'DELETE',
    success: function(data) {
      $(listItem).remove();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      // TODO:: throw up a little message explaining why the word won't save like it should ;)
    }
  });
}

$(function pageload () {
  ShortFeedz = new shortfeedz();
  ShortFeedz.init();
});