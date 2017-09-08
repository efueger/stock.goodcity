import { test, moduleForModel } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('Territory', 'Territory Model', {
  needs: ['model:territory', 'model:district']
});

test('Relationships with other models', function(assert) {
  assert.expect(2);
  var Territory = this.store().modelFor('territory');
  var relationshipWithDistrict = Ember.get(Territory, 'relationshipsByName').get('districts');

  assert.equal(relationshipWithDistrict.key, 'districts');
  assert.equal(relationshipWithDistrict.kind, 'hasMany');
});
