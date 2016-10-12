from transitions import Machine
import logging,json,os,time,requests
from web3 import Web3,RPCProvider,IPCProvider

base_url = "http://localhost:3000/api/"

class Drone(object):
	account = None
	secret = None
	web3_rpc = None
	web3 = None
	states= ["not_registered","not_connected","idle","negotiating","ready_to_fly","flying","charging"]
	def __init__(self,d_id=None,name=None,dist=None,lat=None,lng=None):
		self.name = file(".drone/name","r").read().rstrip()
		self.refuel_dist = file(".drone/refuel_dist","r").read().rstrip()
		self.lat = file(".drone/lat","r").read().rstrip()
		self.lng = file(".drone/lng","r").read().rstrip()
		self.mission = None
		if os.path.isfile("./.drone/account"):
			Drone.account = file(".drone/account","r").read().rstrip()
			if os.path.isfile("./.drone/secret"):
				Drone.secret = file("./.drone/secret","r").read().rstrip()
			temp = Drone.states[1]	
		else:
			temp = Drone.states[0]

		logging.basicConfig(format='%(asctime)s:%(levelname)s:%(message)s', level=logging.INFO)	 	   
		if os.path.isfile(".drone/id"):
			self.drone_id = file(".drone/id","r").read()
			logging.info(self.drone_id)
		else:
			self.drone_id = None


		self.machine = Machine(model=self,states=Drone.states,initial=temp,after_state_change="update_state_change_to_web")

		self.machine.add_transition(trigger="register_success",source="not_registered",dest="idle")
		self.machine.add_transition(trigger="register_fail",source="not_registered",dest="not_registered")
		self.machine.add_transition(trigger="connect_fail",source="not_connected",dest="not_connected")
		self.machine.add_transition(trigger="connect_success",source="not_connected",dest="idle")
		self.machine.add_transition(trigger="recieved_mission_details",source="idle",dest="negotiating")
		self.machine.add_transition(trigger="negotiation_succesful",source="negotiating",dest="ready_to_fly")
		self.machine.add_transition(trigger="negotiation_failure",source="negotiating",dest="negotiating")
		self.machine.add_transition(trigger="start_flight",source="ready_to_fly",dest="flying")
		self.machine.add_transition(trigger="out_of_charge",source="flying",dest="charging")
		self.machine.add_transition(trigger="charge_complete",source="charging",dest="flying")
		self.machine.add_transition(trigger="mission_complete",source="flying",dest="idle")
		logging.info("Added transitions")

		self.machine.on_enter_idle("wait_for_instructions")
		self.machine.on_enter_negotiating("negotiate")
		self.machine.on_enter_ready_to_fly("countdown")
		self.machine.on_enter_flying("fly")
		self.machine.on_enter_charging("charge")
		logging.info("Added state callbacks to machine")
		
		Drone.web3_rpc = Web3(RPCProvider(host="localhost",port="8545"))
		Drone.web3 = Web3(IPCProvider(ipc_path="/home/miner/.ethereum/geth.ipc"))
		if self.web3:
			logging.info("created web3 endpoint")
		else:
			logging.error("Couldnot connect tp geth over RPC")
			logging.info("Make sure that geth is running")
			exit(-1)

	def register(self):
		#This will create an ethereum account for itself,push the publick key to web ui via register API call
		logging.info( "Registering")
		temp_password_file = file("./.drone/secret","w+")
		temp_password = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits + string.ascii_lowercase) for _ in range(10))
		temp_password_file.write(temp_password)
		temp_password_file.close()
		temp_account_file = file("./.drone/account","w+")
		temp_account = Drone.web3.personal.newAccount(temp_password)
		if(temp_account):
			Drone.account = temp_account
			payload = { "type":"drone",
				    "namething":self.name,
				    "something":self.refuel_dist,
				    "lat":self.lat,
				    "lng":self.lng,
				    "address":Drone.account
				  }
			responce = requests.post(base_url+"register",json=payload)
			if responce.json()["status"].encode('utf8') == "success":
				temp_account_file.write(temp_account)
				logging.info("Secret string:",responce.json()["id"].encode('utf8'))
				logging.info("Registration success")
				self.register_success()
			else:
				logging.info("Registration failure")
				self.register_fail()
		else:
			self.register_fail()
			logging.error("Registration failed")
		temp_account_file.close()
	
	def connect(self):
		logging.info("connecting")
		if(Drone.web3.personal.unlockAccount(Drone.account,Drone.secret,5000)):
			if self.drone_id == None:
				payload = {
					"address":str(Drone.account),
					"namething":self.name,
					"something":self.refuel_dist,
					"lat":self.lat,
					"lng":self.lng
				}
				responce = requests.post(base_url+"register",json=payload)
				if responce.json()["status"].encode("utf8") == "success":
					self.drone_id = responce.json()["id"].encode("utf8")
					file("./.drone/id","w+").write(self.drone_id)
					logging.info("connect succesful")
					self.connect_success()
				else:
					self.connect_fail()
			else:
				self.connect_fail()
		else:
			self.connect_fail()
			logging.error("connect failed")
	
	def wait_for_instructions(self):
		fil = Drone.web3.shh.filter({"topics":[Drone.web3.fromAscii("mission_details")]})
		while True:
			temp = Drone.web3.shh.getFilterChanges(fil.filter_id)
			logging.info("Waiting for instruction")
			if temp:
				self.mission_id = Drone.web3.toAscii(temp[0]["payload"])
				self.recieved_mission_details()
				break
			time.sleep(5)
	
	def negotiate(self):
		#Create and publish contract here?
		source = file("../future.sol","r").read()
		code = file("../future.bin","r").read()
		code_runtime = file("../future.bin.runtime","r").read()
		abi = json.loads(file("../future.abi","r").read())
		contract_factory = Drone.web3.eth.contract(abi=abi,code=code,code_runtime=code_runtime,source=source)
		txn = contract_factory.deploy()
		logging.info("deploying contract")
		while Drone.web3.eth.getTransactionReceipt(txn) == None:
			time.sleep(2)
		contract_address =  Drone.web3.eth.getTransactionReceipt(txn)["contractAddress"]
		logging.info("contract deployed at "+str(contract_address))
		self.contract = contract_factory(abi,address=contract_address)
		self.mission = requests.get(base_url+"mission/"+str(self.mission_id)).json()
		print self.mission
		logging.info("fetching mission details")
		#charger_address = self.mission[0]["data"]["charge"][0]["address"]
		self.contract.transact().setPod("0x956842425c38cbca202c4c3c3c1c074e95fe5358",25)
		logging.info("setting charger")	
		self.negotiation_succesful()
	
	def fly(self):
		start = (float(self.mission[0]["data"]["start"]["lat"].encode("utf8")),float(self.mission[0]["data"]["start"]["lng"].encode("utf8")))
		charge1 = (float(self.mission[0]["data"]["charge"][0]["lat"].encode("utf8")),float(self.mission[0]["data"]["charge"][0]["lng"].encode("utf8")))
		stop = (float(self.mission[0]["data"]["stop"]["lat"].encode("utf8")),float(self.mission[0]["data"]["stop"]["lng"].encode("utf8")))
		logging.info("start:"+str(start))
		logging.info("charge1:"+str(charge1))
		logging.info("stop:"+str(stop))
		logging.info("flying")
		
		#simulation
		path1 = []
		num = 30
		latDelta = abs(start[0] - charge1[0])/num
		lngDelta = abs(start[1] - charge1[1])/num

		for i in range(0,num):
			if start[0] > charge1[0]:
				new_lat = start[0]-i*latDelta
			else:
				new_lat = start[0]+i*latDelta
			if start[1] > charge1[1]:
				new_lng = start[1]-i*lngDelta
			else:
				new_lng = start[1]+i*lngDelta

			path1.append((new_lat,new_lng))
			logging.info("at: ("+str(new_lat)+","+str(new_lng)+")")
			payload = { "lat":new_lat,"lng":new_lng }
			resp = requests.post(base_url+"gps_update",json=payload)
			print resp.json()
			if resp.json()["status"]=="success":
				logging.debug("Update success")
			time.sleep(2)
		
		self.out_of_charge()

		path2 = []
		num = 30
		latDelta = abs(charge1[0] - stop[0])/num
		lngDelta = abs(charge1[1] - stop[1])/num
		for i in range(0,num):
			if charge1[0] > stop[0]:
				new_lat = charge1[0]-i*latDelta
			else:
				new_lat = charge1[0]+i*latDelta
			if charge1[1] > stop[1]:
				new_lng = charge1[1]-i*lngDelta
			else:
				new_lng = charge1[1]+i*lngDelta

			path2.append((new_lat,new_lng))
			logging.info("at: ("+str(new_lat)+","+str(new_lng)+")")
			payload = { "lat":new_lat,"lng":new_lng }
			resp = requests.post(base_url+"gps_update",json=payload)
			print resp.json()
			if resp.json()["status"]=="success":
				logging.debug("Update success")
			time.sleep(2)
		self.mission_complete()

	def charge(self):
		logging.debug("charging")
		receipt = self.contract.transact().start()
		logging.info("charging started:"+str(receipt))
		time.sleep(10)
		rate = (10*25)/10
		receipt = self.contract.transact().stop()
		logging.info("charging stopped:"+str(receipt))
		receipt = self.contract.transact().pay()
		logging.info("Total amount paid: "+str(rate))
		receipt = Drone.web3.eth.sendTransaction({"from":Drone.account,"to":"0x956842425c38cbca202c4c3c3c1c074e95fe5358","value":rate})
		logging.info("Payment receipt:"+str(receipt))
		#self.charge_complete()
	def countdown(self):
		for i in range(0,10):
			logging.info("Countdown: "+str(10-i))
			time.sleep(0.5)
		self.start_flight()


	def update_state_change_to_web(self):
		logging.info("State changed")
