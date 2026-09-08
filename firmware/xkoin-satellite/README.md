# xkoin-satellite firmware

Shares the gateway's portable core (../xkoin-gateway/lib): same SX1262 pin map
by design so one driver serves both. Satellite adds deep-sleep beaconing,
TP4056/solar battery sense (GPIO1 ADC), and serving-node receipt collection.
Lands after gateway bring-up.
