import type { Blessing } from "../gameDefinition.js";

function Blessings({ items } : {items: Blessing[]}) {
    return (
        <div>
            {items.map((item, idx) => (
                <div key={idx}>
                    {item.location}
                </div>
            ))}
        </div>
    )
}

export default Blessings;