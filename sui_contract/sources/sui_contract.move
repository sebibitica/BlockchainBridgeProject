module sui_contract::seb_coin;

use sui::coin::{Coin, Self, TreasuryCap};

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

public fun burn(
        treasury_cap: &mut TreasuryCap<SEB_COIN>,
        coin: &mut Coin<SEB_COIN>,
        amount: u64,
        ctx: &mut TxContext,
) {
        let cut_coin = coin::split(coin, amount, ctx);
        let _amount_burned = coin::burn(treasury_cap, cut_coin);
}