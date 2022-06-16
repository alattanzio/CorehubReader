# CorehubReader

React Native Hackaton project to read Corehub data based on SensorScanner by Polydea.

It scans for a specific Corehub (which can be customized) and reads Weight data information.
Information collected can be different.

The weight is then used with the speed of the vehicle to calculate the minimum dinstance to stop safely.

<br>

### Math Formula:
### Work in braking = 0.5 x mass x speed^2 (kinetic energy of the car) = Fd (braking force x braking distance)

