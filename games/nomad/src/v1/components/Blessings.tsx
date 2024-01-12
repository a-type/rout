import type { Blessing } from "../gameDefinition.js";
import { colorLookup } from "./TerrainGrid.js";

function BlessingCard({ item } : {item: Blessing}) {
    return (
        <div 
            className="flex flex-col gap-3"
            style={{backgroundColor: colorLookup[item.location], width: 85, height: 100}}>
            <span>{item.location}</span>
            <span>{item.points}</span>
        </div>
    )
}

function Blessings({ items } : {items: Blessing[]}) {
    return (
        <div className="flex flex-row gap-2">
            {items.map((item, idx) => (
                <BlessingCard key={idx} item={item} />
            ))}
        </div>
    )
}

export default Blessings;