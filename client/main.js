import { Drones } from "../api/cust_collection.js";
import { Pods } from "../api/cust_collection.js";

var table_dependents = new Deps.Dependency;

var MAP_ZOOM = 15;
/*
Meteor.startup(function() {  
	GoogleMaps.load({
		key: "AIzaSyBV9IdofwmFnGWT-hXUp5H3WUpe89PHrLw"
	});
});
*/
function getThings(user){
	if(user['profile']['type'] == "Drone"){
		return Drones;
	}
	else if(user['profile']['type'] == "Pod"){
		return Pods;
	}
}

Template.register.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#email").value;
		var passVar = template.find("#password").value;
		var typeVar = template.find("#type").value;
		var username = emailVar.substring(0,emailVar.indexOf('@'))
		console.log("Form submitted!");
		Accounts.createUser({
			email: emailVar,
			password: passVar,
			profile: {
				username: username,
				type: typeVar
			}
		},
		function(error){
			template.find("#alert").style.display = "block";
			template.find("#alert").className = "alert alert-danger";
			template.find("#alert").innerHTML = "Registration failed!";
			//console.log(error.reason);
		});
	}
});

Template.login.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#login_email").value;
		var passVar = template.find("#login_password").value;
		console.log("Form submitted!");
		Meteor.loginWithPassword(emailVar,passVar,function(error){
			template.find("#alert").style.display = "block";
			template.find("#alert").className = "alert alert-danger";
			template.find("#alert").innerHTML = "Snap..Login failed!";
			//console.log(error.reason);
		});
	}
});

Template.dashboard.events({
	"click .logout":function(event){
		event.preventDefault();
		Meteor.logout();
	},
	"click .add":function(event,template){
		event.preventDefault();
		console.log("adding");
	}
});

Template.addthing.events({
	"submit form":function(event,template){
		event.preventDefault();
		var namething = template.find("#name").value;
		var keything = template.find("#key").value;
		var user = Meteor.user();
		if(user['profile']['type'] == "Drone"){
			var Things = Drones;
		}
		else if(user['profile']['type'] == "Pod"){
			var Things = Pods;
		}
		//console.log("adding thing");
		//console.log(Things.find().fetch()[0]['user']);
		//console.log(Things.find(user._id).fetch()[0]);
		if(!Things.find(user._id).fetch()[0]){
			console.log("New user");
			Things.insert({
				_id: user._id,
				data:[{
					namething: namething,
					keything: keything
				},]
			});
		}else{
			console.log("New thing for the old user");
			Things.update(
				{"_id":user._id},
				{ "$addToSet":{ data:{
					namething:namething,
					keything:keything
				}
			}
		}
		);
			//console.log(Things.find(user._id).fetch()[0]);
		}
		//console.log(template);
		template.find("#alert").style.display = "block";
		//console.log(template.find("#alert"));
		table_dependents.changed();
	},
	"click #picklocation":function(event,template){
		event.preventDefault();
		$("#location_picker").modal('show');
	}
});

Template.table.helpers({
	vals: function(template){
		table_dependents.depend();
		var things = getThings(Meteor.user());
		//console.log(things.find(Meteor.userId()).fetch()[0]['data']);
		if(things.find(Meteor.userId()).fetch()[0]['data'].length === 0){
			//document.getElementById("alert_table");
		}
		//console.log(template.find("#alert_table"));
		var temp = {
			col_name1: "column1",
			col_name2: "column2",
			col_name3: "column3",
			data: things.find(Meteor.userId()).fetch()[0]['data'].length > 0 ? things.find(Meteor.userId()).fetch()[0]['data']:undefined
		}
		return temp;
	}
});

Template.location_picker_template.events({
	"click #save":function(events,template){
		console.log("saving location");
		console.log("Saving location",document.getElementById('latitude').innerHTML,":",
			document.getElementById('longitude').innerHTML);
		$('#location_picker').modal('hide');
	}
});


Template.location_picker_template.onRendered(function(){
	var mapDiv = document.getElementById('map_pick_location');
	var markers = [];
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			document.getElementById('latitude').innerHTML = position.coords.latitude;
			document.getElementById('longitude').innerHTML = position.coords.longitude;
		}, function() {
			console.log("Couldnot get geolocation!",error.reason);
		});
	} else {
		console.log("browser doesnot support geolocation");
	}
	/*
	var lat = parseFloat(document.getElementById('latitude').innerHTML);
	var lon = parseFloat(document.getElementById('longitude').innerHTML);

	var test = new google.maps.LatLng(lat,lon);
	*/
	var test = new google.maps.LatLng(12.9189066,77.6478741);
	var map = new google.maps.Map(mapDiv, {
		center: test,
		zoom: MAP_ZOOM
	});

	google.maps.event.addListener(map,'click',function(event) {
		if(markers.length == 0){
			marker = new google.maps.Marker({
				position: event.latLng,
				map: map,
				title: 'Click Generated Marker',
				draggable:true
			});
			google.maps.event.addListener(marker,'dragend',function(event){
				document.getElementById('latitude').innerHTML = event.latLng.lat();
				document.getElementById('longitude').innerHTML = event.latLng.lng();
			});
			console.log(event.latLng.lat(),":",event.latLng.lng());
			markers.push(marker);
			document.getElementById('latitude').innerHTML = event.latLng.lat();
			document.getElementById('longitude').innerHTML = event.latLng.lng();
		}
	}
	);

});

Template.map.onRendered(function(){
	var map = document.getElementById('map_dashboard');
	console.log("map rendered");
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			document.getElementById('latitude').innerHTML = position.coords.latitude;
			document.getElementById('longitude').innerHTML = position.coords.longitude;
		}, function() {
			console.log("Couldnot get geolocation!");
		});
	} else {
		console.log("browser doesnot support geolocation");
	}
	/*
	console.log(new google.maps.LatLng(parseFloat(document.getElementById('latitude').innerHTML),parseFloat(document.getElementById('longitude').innerHTML)));
	var lat = parseFloat(document.getElementById('latitude').innerHTML);
	var lon = parseFloat(document.getElementById('longitude').innerHTML);
	
	var test = new google.maps.LatLng(lat,lon);
	*/
	var test = new google.maps.LatLng(12.9189066,77.6478741);
	var map = new google.maps.Map(map, {
		center: test,
		zoom: MAP_ZOOM
	});
});
