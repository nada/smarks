//on init page load, this runs 2 times, can't figure out why...
Template.view_tm.rendered = function () {
	$('div.btn-group button').click(function(){
		Session.set('layout',$(this).val());
	});
};


// DAYLINE _________________________________________________
Template.dayline.days = function() {
	var q = {};
	if(!Session.equals("tag_filters", null))
	{
		//q =  {$or:[{tags:{$exists:false}},{tags:{$in:Session.get("tag_filters")}}]};
		q = {tags:{$in:Session.get("tag_filters")}};
	}
	var res = Smarks.find(q, {sort: {timestamp:-1}});

	var days = [];
	var today = new Date();
	var dayStamp = (new Date(today.getFullYear(), today.getMonth(), today.getDate())).getTime();
	res.map(function(doc)
	{
		while(doc.timestamp < dayStamp)
		{
			dayStamp -= 24*60*60*1000;
		}
		if(!days["_" + dayStamp]) days["_" + dayStamp] =[];
		days["_" + dayStamp].push(doc);
	});
	var ret = [];
	var cnt = 0;
	for(i in days) ret.push({"data":days[i], "counter":cnt++, "daystamp":i.substr(1)});
	console.log(ret);
	sJS.updateTitle(res.count());
	return ret;
};

Template.day.daycollection = function() {
	return this.data;
}

Template.day.daystring = function() {
	console.log(this.data.length);
	return new Date(parseInt(this.daystamp)).format('dddd, mmmm dS, yyyy') + " ["+this.data.length+"]";
}

Template.day.daylink = function() {
	if(this.embedly)
		return this.embedly[0].url;
	else 
		return "#";
}

Template.day.dayentry = function() {
	if(this.embedly)
		return this.embedly[0].title;
	else 
		return this.smark;
}

Template.day.rendered = function() {
	//expand first node
	$('#smarkdayaccordion #collapse0').collapse('show');
}

/*
Template.timeline.rendered = function() {
	//how to do that in meteor??
	var favDocs = Favs.find({owner:Meteor.userId()}).fetch();
	for(var d in favDocs) {
		$('.box.smark[data-id='+favDocs[d].postId+']').addClass("favourite");
	}
};
*/