import logging,time
from transitions import Machine
from transitions import logger

logger.setLevel(logging.INFO)

class Drone(object):
	states= ["not_registered","idle","negotiating","ready_to_fly","flying","charging"]
	def __init__(self,d_id,name,dist,lat,lng):
		self.drone_id = d_id
		self.name = name
		self.refuel_dist = dist
		self.lat = lat
		self.lng = lng

		self.machine = Machine(model=self,states=Drone.states,initial="not_registered")

		self.machine.add_transition(trigger="register_success",source="not_registered",dest="idle")
		self.machine.add_transition(trigger="register_fail",source="not_registered",dest="not_registered")
		self.machine.add_transition(trigger="recieved_mission_details",source="idle",dest="negotiating")
		self.machine.add_transition(trigger="negotiation_succesful",source="negotiating",dest="ready_to_fly")
		self.machine.add_transition(trigger="negotiation_failure",source="negotiating",dest="negotiating")
		self.machine.add_transition(trigger="start_flight",source="ready_to_fly",dest="flying")
		self.machine.add_transition(trigger="out_of_charge",source="flying",dest="charging")
		self.machine.add_transition(trigger="charge_complete",source="charging",dest="flying")
		self.machine.add_transition(trigger="mission_complete",source="flying",dest="idle")

		self.machine.on_enter_idle("wait_for_instructions")
		self.machine.on_enter_negotiating("negotiate")
		self.machine.on_enter_charging("charge")

	def register(self):
		#This will create an ethereum account for itself,push the publick key to web ui via register API call
		print "registering"
		time.sleep(2)
		print "registration succesful"
		self.register_success()
	
	def wait_for_instructions(self):
		print "waiting for instruction"
		time.sleep(2)
		self.recieved_mission_details()
	
	def negotiate(self):
		print "negotiating"
		time.sleep(2)
		print "negotiation succesful"
		self.negotiation_succesful()
	
	def fly(self):
		print "flying"
		self.start_flight()
		time.sleep(2)
		self.out_of_charge()
		time.sleep(2)
		self.charge_complete()
		time.sleep(2)
		print "mission complete"
		self.mission_complete()

	def charge(self):
		print "charging"
		time.sleep(2)
		print "charging complete"
		
