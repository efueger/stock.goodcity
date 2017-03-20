// import Ember from 'ember';
import AuthorizeRoute from './../authorize';
// const { getOwner } = Ember;

export default AuthorizeRoute.extend({
  queryParams:{
    orderPackageId: null
  },
  model(params){
    return this.store.peekRecord("item", params.item_id) || this.store.findRecord('item', params.item_id);
  },
});
