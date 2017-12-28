// import Organisation from "./organisation";
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import Ember from "ember";
import { hasMany } from 'ember-data/relationships';
export default Model.extend({
  nameEn: attr('string'),
  website: attr('string'),
  registration: attr('string'),

  organisationsUsers: hasMany('organisations_user', { async: false }),
  designations: hasMany('designation', { async: false }),

  ordersCount: Ember.computed('designations.[]', function(){
    return this.get('designations.length');
  }),

  usersCount: Ember.computed('organisationsUsers.[]', function(){
    return this.get('organisationsUsers.length');
  })
});
