/**
  This view handles rendering of the header of the site

  @class HeaderView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.HeaderView = Discourse.View.extend({
  tagName: 'header',
  classNames: ['d-header', 'clearfix'],
  classNameBindings: ['editingTopic'],
  templateName: 'header',

  showDropdown: function($target) {
    var elementId = $target.data('dropdown') || $target.data('notifications'),
        $dropdown = $("#" + elementId),
        $li = $target.closest('li'),
        $ul = $target.closest('ul'),
        $html = $('html'),
        self = this;

    self.set('controller.visibleDropdown', elementId);
    // we need to ensure we are rendered,
    //  this optimises the speed of the initial render
    var render = $target.data('render');
    if(render){
      if(!this.get(render)){
        this.set(render, true);
        Em.run.next(this, function(){
          this.showDropdown.apply(self, [$target]);
        });
        return;
      }
    }

    var hideDropdown = function() {
      $dropdown.fadeOut('fast');
      $li.removeClass('active');
      $html.data('hide-dropdown', null);
      self.set('controller.visibleDropdown', null);
      return $html.off('click.d-dropdown');
    };

    // if a dropdown is active and the user clicks on it, close it
    if($li.hasClass('active')) { return hideDropdown(); }
    // otherwhise, mark it as active
    $li.addClass('active');
    // hide the other dropdowns
    $('li', $ul).not($li).removeClass('active');
    $('.d-dropdown').not($dropdown).fadeOut('fast');
    // fade it fast
    $dropdown.fadeIn('fast');
    // autofocus any text input field
    $dropdown.find('input[type=text]').focus().select();

    $html.on('click.d-dropdown', function(e) {
      return $(e.target).closest('.d-dropdown').length > 0 ? true : hideDropdown.apply(self);
    });

    $html.data('hide-dropdown', hideDropdown);

    return false;
  },

  showDropdownBySelector: function(selector) {
    this.showDropdown($(selector));
  },

  showNotifications: function() {
    this.get("controller").send("showNotifications", this);
  },

  examineDockHeader: function() {

    var headerView = this;

    // Check the dock after the current run loop. While rendering,
    // it's much slower to calculate `outlet.offset()`
    Em.run.next(function () {
      if (!headerView.docAt) {
        var outlet = $('#main-outlet');
        if (!(outlet && outlet.length === 1)) return;
        headerView.docAt = outlet.offset().top;
      }

      var offset = window.pageYOffset || $('html').scrollTop();
      if (offset >= headerView.docAt) {
        if (!headerView.dockedHeader) {
          $('body').addClass('docked');
          headerView.dockedHeader = true;
        }
      } else {
        if (headerView.dockedHeader) {
          $('body').removeClass('docked');
          headerView.dockedHeader = false;
        }
      }
    });

  },

  willDestroyElement: function() {
    $(window).unbind('scroll.discourse-dock');
    $(document).unbind('touchmove.discourse-dock');
    this.$('a.unread-private-messages, a.unread-notifications, a[data-notifications]').off('click.notifications');
    this.$('a[data-dropdown]').off('click.dropdown');
  },

  didInsertElement: function() {

    var self = this;

    this.$('a[data-dropdown]').on('click.dropdown', function(e) {
      self.showDropdown.apply(self, [$(e.currentTarget)]);
      return false;
    });
    this.$('a.unread-private-messages, a.unread-notifications, a[data-notifications]').on('click.notifications', function(e) {
      self.showNotifications(e);
      return false;
    });
    $(window).bind('scroll.discourse-dock', function() {
      self.examineDockHeader();
    });
    $(document).bind('touchmove.discourse-dock', function() {
      self.examineDockHeader();
    });
    self.examineDockHeader();

    // Delegate ESC to the composer
    $('body').on('keydown.header', function(e) {
      // Hide dropdowns
      if (e.which === 27) {
        self.$('li').removeClass('active');
        self.$('.d-dropdown').fadeOut('fast');
      }
      if (self.get('editingTopic')) {
        if (e.which === 13) {
          self.finishedEdit();
        }
        if (e.which === 27) {
          return self.cancelEdit();
        }
      }
    });
  }
});


