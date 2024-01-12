import { CoordinateKey, Terrain, TerrainType } from "../gameDefinition.js";

const colorLookup: Record<TerrainType, string> = {
    'desert': 'yellow',
    'forest': 'green',
    'mountain': 'gray',
    'ocean': 'blue',
}

function TerrainTile({ item, hasPlayer }: {item: Terrain, hasPlayer: boolean}) {
    const color = colorLookup[item.type];
    return <div style={{backgroundColor: color, width: 40, height: 40}}>
        {hasPlayer && <div style={{backgroundColor: 'red', width: 20, height: 20}}>P</div>}
    </div>
}

function TerrainGrid({ items, playerLocation }: {items: Record<CoordinateKey, Terrain>, playerLocation: CoordinateKey}) {
    const itemsToGrid = Object.entries(items).reduce((acc, [key, item]) => {
        const [x, y] = key.split(',');
        return {
            ...acc,
            [x]: {
                ...acc[x],
                [y]: item,
            }
        }
    }, {} as Record<string, Record<string, Terrain>>)
    const [playerX, playerY] = playerLocation.split(',');

    return <div className="flex flex-row gap-1">
        {
            Object.entries(itemsToGrid).map(([x, row]) => (
                <div key={x} className="flex flex-col gap-1">
                    {
                        Object.entries(row).map(([y, item]) => (
                            <div key={y}>
                                <TerrainTile 
                                    item={item}
                                    hasPlayer={x === playerX && y === playerY} 
                                />
                            </div>
                        ))
                    }
                </div>
            ))
        }
    </div>
}

export default TerrainGrid;