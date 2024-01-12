import type { Blessing } from "../gameDefinition.js";
import { colorLookup } from "./TerrainGrid.js";

function Blessings({ items } : {items: Blessing[]}) {
    return (
        <div className="flex flex-row gap-2">
            {items.map((item, idx) => (
                <div key={idx} style={{backgroundColor: colorLookup[item.location], width: 85, height: 100}}>
                    {item.location}
                </div>
            ))}
        </div>
    )
}

export default Blessings;