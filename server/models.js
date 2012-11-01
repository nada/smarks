//models

//SMARKS
Smarks = new Meteor.Collection("smarks");
Smarks.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    return (userId && doc.owner === userId);
  },
  update: function (userId, docs, fields, modifier) {
    // can only change your own documents
    return _.all(docs, function(doc) {
      return doc.owner === userId;
    });
  },
  remove: function (userId, docs) {
    // can only remove your own documents
    return _.all(docs, function(doc) {
      return doc.owner === userId;
    });
  }/*,
  fetch: ['owner']*/
});

Smarks.deny({
  update: function (userId, docs, fields, modifier) {
    // can't change owners
    return _.contains(fields, 'owner');
  }
});


//FAVS
Favs = new Meteor.Collection("favs");
Favs.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    return (userId && doc.owner === userId);
  },
  remove: function (userId, docs) {
    // can only remove your own documents
    return _.all(docs, function(doc) {
      return doc.owner === userId;
    });
  }/*,
  fetch: ['owner']*/
});

Favs.deny({
  update: function (userId, docs, fields, modifier) {
    // can't change owners
    return _.contains(fields, 'owner');
  }
});

//SUPERUSERS
SuperU = new Meteor.Collection("superu");
SuperU.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    return (userId && doc.owner === userId);
  },
  remove: function (userId, docs) {
    // can only remove your own documents
    return _.all(docs, function(doc) {
      return doc.owner === userId;
    });
  }/*,
  fetch: ['owner']*/
});
SuperU.deny({
  update: function (userId, docs, fields, modifier) {
    // can't change owners
    return _.contains(fields, 'owner');
  }
});

