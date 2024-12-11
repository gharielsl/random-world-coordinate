# Random World Coordinate

Generate a random coordinate in the world or specific countries

### Using
Run `npm i random-world-coordinate`

```js
import randomCoordinate from 'random-world-coordinate';

randomCoordinate(["Israel", "Australia"], 0).then((coord) => {
    console.log("lon: " + coord[1]);
    console.log("lat: " + coord[0]);
});
```

### Country Vectors

I'm using https://github.com/nvkelso/natural-earth-vector/