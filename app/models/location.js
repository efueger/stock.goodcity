import Ember from 'ember';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  area:     attr('string'),
  building: attr('string'),

  name: Ember.computed('area', 'building', function() {
    var area = this.get("area");
    var building = this.get("building");
    return area ? `${area}-${building}` : building;
  }),
});
