module sui_contract::seb_coin;

use sui::coin::{Coin, Self, TreasuryCap};
use sui::event;

public struct SEB_COIN has drop {}

fun init(witness: SEB_COIN, ctx: &mut TxContext) {
		let (treasury, metadata) = coin::create_currency(
				witness,
				6,
				b"SEB",
				b"SEB",
				b"SEB",
				option::none(),
				ctx,
		);
		transfer::public_freeze_object(metadata);
		transfer::public_transfer(treasury, ctx.sender());
}

public fun mint(
		treasury_cap: &mut TreasuryCap<SEB_COIN>,
		amount: u64,
		recipient: address,
		ctx: &mut TxContext,
){
		let coin = coin::mint(treasury_cap, amount, ctx);
		transfer::public_transfer(coin, recipient);
}

public struct CoinTransferToBurnEvent has copy, drop {
        sender: address,
        recipient: address,
        amount: u64,
		coin_id: ID
}
// Only the owner of the coin can burn
// so this function is for users to send their coins to the owner
// and the owner will burn the coins for them
public fun split_and_transfer_for_burn(
        coin: &mut Coin<SEB_COIN>,
		recipient: address,
        amount: u64,
        ctx: &mut TxContext
) {
		let split_coin = coin::split(coin, amount, ctx);
		let coin_id = object::id(&split_coin);
        
        transfer::public_transfer(split_coin, recipient);
        
        event::emit(CoinTransferToBurnEvent {
            sender: ctx.sender(),
            recipient,
            amount,
            coin_id,
        });
}

public fun burn(
        treasury_cap: &mut TreasuryCap<SEB_COIN>,
        coin: Coin<SEB_COIN>,
) {
        let _amount = coin::burn(treasury_cap, coin);
}