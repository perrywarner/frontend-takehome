import { useEffect, useState } from "react";
import { fetchAllPokemon, fetchPokemonDetailsByName, fetchEvolutionChainById } from "./api";

function App() {
    const [pokemonIndex, setPokemonIndex] = useState([])
    const [pokemon, setPokemon] = useState([])
    const [searchValue, setSearchValue] = useState('')
    const [pokemonDetails, setPokemonDetails] = useState()
    const [evolutionChain, setEvolutionChain] = useState();
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        const fetchPokemon = async () => {
            setIsFetching(true);
            const {results: pokemonList} = await fetchAllPokemon()

            setPokemon(pokemonList)
            setPokemonIndex(pokemonList)
        }

        fetchPokemon().then(() => {
            setIsFetching(false);
        })
    }, [])

    const onSearchValueChange = (event) => {
        const value = event.target.value
        setSearchValue(value)

        setPokemon(
            pokemonIndex.filter(monster => monster.name.includes(value))
        )
    }

    
    const onGetDetails = (name) => async () => {
        fetchPokemonDetailsByName(name).then((pokemonDetail) => {
            setPokemonDetails(pokemonDetail);
            
            fetchEvolutionChainById(pokemonDetail.id).then((evolutionChainData) => {
                // note: limiting the nested evolution tree depth to two levels - i.e. 0: bulbasaur -> 1: ivysaur -> 2: venusaur -> (none)
                // * judging this to be fine since I have background domain knowledge that there aren't any situations of 4+ evo chain in first 150 (gen 1) pokemon
                const nextEvolves = new Map();
                evolutionChainData.chain?.evolves_to.forEach((firstEvolve) => {
                    const secondEvolveNames = firstEvolve.evolves_to?.map((secondEvolve) => {
                        return secondEvolve.species.name;
                    })
                    nextEvolves.set(firstEvolve.species.name, { name: firstEvolve.species.name, secondEvolveNames: secondEvolveNames });
                });
                setEvolutionChain(nextEvolves);
            })
        })
    }

    const buildSecondEvolutions = () => {
        if (!evolutionChain || evolutionChain.size === 0) {
            return null;
        } else {
            let results = [];
            evolutionChain.forEach((chain) => {
                results.push(chain.secondEvolveNames)
            });
            return results;
        }
    }

    const types = pokemonDetails !== undefined ? pokemonDetails.types : null;
    const moves = pokemonDetails !== undefined ? pokemonDetails.moves : null;
    const firstEvolutions = evolutionChain !== undefined ? Array.from(evolutionChain.keys()) : null;
    const secondEvolutions = buildSecondEvolutions();
    return (
        <div className={'pokedex__container'}>
            <div className={'pokedex__search-input'}>
                <input value={searchValue} onChange={onSearchValueChange} placeholder={'Search Pokemon'}/>
            </div>
            <div className={'pokedex__content'}>
                {pokemon.length > 0 && (
                    <div className={'pokedex__search-results'}>
                        {
                            pokemon.map(monster => {
                                return (
                                    <div className={'pokedex__list-item'} key={monster.name}>
                                        <div>
                                            {monster.name}
                                        </div>
                                        <button onClick={onGetDetails(monster.name)}>Get Details</button>
                                    </div>
                                )
                            })
                        }
                    </div>
                )}
                {pokemon.length === 0 && !isFetching && (
                    <p>No Results Found</p>
                )}
                {
                    pokemonDetails && (
                        <div className={'pokedex__details'}>
                            <div className={'pokedex__details__section'}>
                                <strong>{pokemonDetails.name}</strong>
                            </div>
                            <div className={'pokedex__details__section'}>
                                <div>
                                    <strong>Types</strong>
                                    <ul>
                                        {types.map((type, index) => {
                                            return <li key={`types-${index}`}>{type.type.name}</li>;
                                        })}
                                    </ul>
                                </div>
                                <div>
                                    <strong>Moves</strong>
                                    <ul>
                                        {/* warning: mockup indicated 4 moves of bulbasaur but when I tried https://pokeapi.co/api/v2/pokemon/bulbasaur it returned a moves[] of length 82. 
                                        * going to fix the max visible moves to 4 to align with mockup for now */}
                                        {moves.map((move, index) => {
                                            if (index < 4) {
                                                return <li key={`moves-${index}`}>{move.move.name}</li>;
                                            }
                                        })}
                                    </ul>
                                </div>
                            </div>
                            <div className={'pokedex__details__evolutions__section'}>
                                <strong>Evolutions</strong>
                                {/* noting that the mockup doesn't seem to account for n parallel stage evolutions so I'm going to go forward with building a bit past the initial mockup
                                * for example, I believe that "Eevee" would have at least three potential first stage evolutions "Jolteon", "Flareon", "Vaporeon" and possibly more (depending on Pokemon version)
                                * also, speaking of Eevee, seems like there's a bug in the PokeAPI where eevee is https://pokeapi.co/api/v2/pokemon/133 but https://pokeapi.co/api/v2/evolution-chain/133 is poochyena (?)
                                */}
                                <div className="pokedex__details__evolution__column__wrapper">
                                    <div>
                                        <p style={{ 'fontStyle': 'italic' }}>{pokemonDetails.name}</p>
                                    </div>
                                    {firstEvolutions ? 
                                        <div>
                                            {firstEvolutions.map((evolutionName) => {
                                                return <p style={{ 'fontStyle': 'italic' }}>{evolutionName}</p>
                                            })}
                                        </div>
                                    : null}
                                    {secondEvolutions ? 
                                        <div>
                                            {secondEvolutions.map((evolutionName) => {
                                                return <p style={{ 'fontStyle': 'italic' }}>{evolutionName}</p>
                                            })}
                                        </div>
                                    : null}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default App;
