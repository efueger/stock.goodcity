import Ember from "ember";
import AjaxPromise from 'stock/utils/ajax-promise';
const { getOwner } = Ember;

export default Ember.Component.extend({
  displayUserPrompt: false,
  displayAlertOverlay: false,
  showAllSetItems: false,
  autoDisplayOverlay: false,
  hideDetailsLink: true,
  showDispatchOverlay: false,
  partial_quantity: 0,
  messageBox: Ember.inject.service(),
  partiallyDesignatedPopUp: false,
  designatedSetOrdersPackages: [],
  partialDesignatedConfirmationPopUp: false,
  totalPartialDesignatedItems: 0,
  designatedRecord: null,
  cannotDesignateToSameOrder: false,
  designateFullSet: Ember.computed.localStorage(),

  order: null,
  item: null,
  toggleOverlay: null,
  isSet: null,
  store: Ember.inject.service(),
  i18n: Ember.inject.service(),
  designatedOnce: true,
  alreadyPartiallyDesignated: false,
  orderPackageId: null,
  alreadyShown: true,
  hasCancelledState: false,

  returnsDesignateFullSet: Ember.computed('item.setItem.items', function() {
    return !window.localStorage.getItem('designateFullSet').includes(false);
  }),

  overridesDesignation: Ember.computed('item.setItem.designationList.[]', 'order', function() {

    if(this.get("item.isSet")) {
      var list = [];
      this.get("item.setItem.items").rejectBy('designation', null).forEach(item => {
        list.push(item.get("designation.code"));
      });
      list.filter((e, i, list) => { i = list.indexOf(e) === i; });

      if(list.length === 0) {
        return false;
      } else {
        var index = list.indexOf(this.get('order.code'));
        if(index > -1) { list.splice(index, 1); }
        return list.length > 0;
      }
    } else {
      return false;
    }
  }),

  triggerOrderClick: Ember.observer("order", "toggleOverlay", function() {
    this.set('hasCancelledState', false);
    this.set('partial_quantity', getOwner(this).lookup('controller:items.search_order').get('partial_qty'));
    if(this.get("order") && getOwner(this).lookup('controller:items.detail').get('callOrderObserver')) {
      this.send("displayDesignateOverlay");
    }
  }),

  isDesignatedToCurrentOrder: Ember.computed('order', 'item', function() {
    return this.get("order.items").findBy("id", this.get("item.id"));
  }),

  triggerItemClick: Ember.observer("autoDisplayOverlay", function() {
    if(this.get("autoDisplayOverlay")) {
      this.send("displayDesignateOverlay");
    }
  }),

  cancelledState: Ember.computed('order', 'item', function() {
    this.set('hasCancelledState', false);
    var item = this.get('item');
    var order = this.get('order');
    this.get('store').peekAll("orders_package").filterBy("itemId", parseInt(item.id)).forEach(record => {
      if(record.get('itemId') === parseInt(item.id) && record.get('designationId') === parseInt(order.id)) {
          if (record.get('state') === "cancelled")
          {
            this.set('hasCancelledState', true);
          }
          this.set('orderPackageId', record.get('id'));
        }
      });
    return this.get('hasCancelledState');
  }),

  isDesignatedToCurrentPartialOrder: Ember.computed('order', 'item', function() {
    var total = 0;
    this.set('partiallyDesignatedPopUp', false);
    this.set('partialDesignatedConfirmationPopUp', false);
    this.set('cannotDesignateToSameOrder', false);
    this.set('alreadyPartiallyDesignated', false);
    this.set('hasCancelledState', false);
    var order = this.get('order');
    var item = this.get('item');
    var designatedSetOrdersPackages = [];
    if(item.get("isSet")) {
      item.get("setItem.items").forEach(item => {
      item.get("ordersPackages").forEach(record => {
        if(record.get("state") !== "cancelled" && record.get('itemId') === parseInt(item.id) && record.get('designationId') === parseInt(order.id)) {
            this.set('alreadyPartiallyDesignated', true);
            this.set('orderPackageId', record.get('id'));
            designatedSetOrdersPackages.push(record);
          }
        });
      });
      this.set("designatedSetOrdersPackages", designatedSetOrdersPackages);
      return this.get("alreadyPartiallyDesignated");
    } else {
      this.get('store').peekAll("orders_package").filterBy("itemId", parseInt(item.id)).forEach(record => {
        if(record.get('itemId') === parseInt(item.id) && record.get('designationId') === parseInt(order.id)) {
            total += record.get('quantity');
            this.set("designatedRecord", record);
            this.set('alreadyPartiallyDesignated', true);
            this.set('orderPackageId', record.get('id'));
          }
        });
      this.set('totalPartialDesignatedItems', total);
      return this.get('alreadyPartiallyDesignated');
    }
  }),

  actions: {
    displayDesignateOverlay() {
      this.set('partiallyDesignatedPopUp', false);
      this.set('partialDesignatedConfirmationPopUp', false);
      this.set('cannotDesignateToSameOrder', false);

      if(getOwner(this).lookup('controller:items.search_order').get('notPartialRoute') && this.get('isDesignatedToCurrentPartialOrder') )
      {
        this.set('cannotDesignateToSameOrder', true);
        return false;
      }

      if(this.get('partial_quantity') && this.get('isDesignatedToCurrentPartialOrder') ) {
        if(this.get('designatedOnce') && !this.get('cancelledState')) {
          this.set('partiallyDesignatedPopUp', true);
          return true;
        } else if(this.get('designatedOnce')) {
          this.set('partialDesignatedConfirmationPopUp', true);
          return true;
        }
      } else if (this.get('partial_quantity')) {
        if(this.get('designatedOnce')) {
          this.set('partialDesignatedConfirmationPopUp', true);
          return true;
        }
      } else {
        this.set("displayUserPrompt", true);
      }
    },

    designateItem() {
      var order = this.get("order");
      var item = this.get("item");
      this.set("showAllSetItems", false);

      var loadingView = getOwner(this).lookup('component:loading').append();
      var url = `/items/${item.get('id')}/designate_partial_item`;

      var  properties = {
        order_id: order.get("id"),
        package_id: item.get('id'),
        quantity: item.get('quantity'),
      };

      new AjaxPromise(url, "PUT", this.get('session.authToken'), { package: properties })
        .then(data => {
          this.get("store").pushPayload(data);
          this.get('router').transitionTo("orders.detail", order);
        })
        .finally(() => {
          loadingView.destroy();
        });

    },

    designatePartialItem() {
      this.set('designatedOnce', false);
      var order = this.get("order");
      var item = this.get("item");
      var showAllSetItems = this.get("showAllSetItems");
      this.set("showAllSetItems", false);
      var isSameDesignation = this.get('partial_quantity') && this.get('isDesignatedToCurrentPartialOrder');

      var loadingView = getOwner(this).lookup('component:loading').append();
      var url;
      var  properties = {
        order_id: order.get("id"),
        package_id: item.get('id'),
        quantity: this.get('partial_quantity'),
      };

      if(item.get('isSet') && this.get('designateFullSet')) {
        url = `/items/${item.get('setItem.id')}/designate_stockit_item_set`;
      } else  if(isSameDesignation || this.get('cancelledState')) {
        properties.state = "cancelled";
        url = `/items/${item.get('id')}/update_partial_quantity_of_same_designation`;
      } else {
        url = `/items/${item.get('id')}/designate_partial_item`;
      }


      if(isSameDesignation) {
        properties.operation = "update";
        properties.orders_package_id = this.get('orderPackageId');
      }

      new AjaxPromise(url, "PUT", this.get('session.authToken'), { package: properties })
        .then(data => {
          this.get("store").pushPayload(data);
          if(item.get("isSet")) {
            this.get('router').transitionTo("items.index");
          } else if(showAllSetItems) {
            this.sendAction("displaySetItems");
          } else {
            loadingView.destroy();
            this.get('router').transitionTo("items.index");
          }
        })
        .finally(() => {
          loadingView.destroy();
        });
    }
  }

});
