import config from '../../config/environment';
import Ember from "ember";
import searchModule from "../search_module";

export default searchModule.extend({

  queryParams: ['searchInput'],
  searchInput: "",
  hideDetailsLink: true,
  dataOnceRequested: false,

  orderId: Ember.computed.alias("model.id"),
  isMobileApp: config.cordova.enabled,
  autoDisplayOverlay: false,
  minSearchTextLength: 2,

  onSearchTextChange: Ember.observer("searchText", function() {
    this.set('dataOnceRequested', false);
    this._super(...arguments);
  }),

  applyFilter() {
    this.set("autoDisplayOverlay", false);
    var searchText = this.get("searchText").trim();
    if (searchText) {
      this.set("isLoading", true);
      this.set("hasNoResults", false);
      this.infinityModel("item",
        { perPage: 25, startingPage: 1, modelPath: 'filteredResults', stockRequest: true },
        { orderId: "orderId", searchText: "searchText", itemId: "itemSetId" })
        .then(data => {
          data.forEach(item => {
            if(item && item.get("quantity") === 0) {
              data.removeObject(item);
            }
            if(item &&item.get('itemId') && !this.get('dataOnceRequested')) {
              this.set('dataOnceRequested', true);
              this.send('displaySetItems', item);
            }
          });
          if(this.get("searchText").trim() === data.meta.search) {
            this.set("filteredResults", data);
            this.set("hasNoResults", data.get("length") === 0);
          }

          if(data.get("length") === 1) {
            Ember.run.debounce(this, this.triggerDisplayDesignateOverlay, 100);
          }
        })
        .finally(() => this.set("isLoading", false));
    }
    this.set("filteredResults", []);
  },

  triggerDisplayDesignateOverlay(){
    this.set("autoDisplayOverlay", true);
  },

  actions: {
    displaySetItems(item) {
      this.set("itemSetId", item.get("itemId"));
      Ember.run.debounce(this, this.applyFilter, 0);
    }
  }
});
