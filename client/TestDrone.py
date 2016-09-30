#!/usr/bin/python
import random
from Drone import Drone


d = Drone(random.randint(0,9),"ame","5km","12.43543","34.4355")
if d.is_not_registered():
	d.register()

if d.is_not_connected():
	d.connect()
