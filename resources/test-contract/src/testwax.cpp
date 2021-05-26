#include <testwax.hpp>

ACTION testwax::update(name updater, string message, bool fail) {
  _update(updater, message, fail);
  calllog(get_self(), message);
}

ACTION testwax::calllog(name logger, string message) {
  action(
    permission_level{get_self(), name("active")},
    logger,
    name("log"),
    make_tuple(message))
    .send();
}

void testwax::_update(name updater, string message, bool fail) {
  require_auth(updater);

  check(!fail, "update fail requested by caller");
  
  messages_table _messages(get_self(), get_self().value);
  auto itr = _messages.find(updater.value);
  if(itr == _messages.end()) {
    _messages.emplace(updater, [&](auto& row) {
      row.updater = updater;
      row.message = message;
    });
  } else {
    _messages.modify(itr, updater, [&](auto &rec) {
      rec.message = message;
    });    
  }
}

ACTION testwax::loop(name looper, int64_t count) {
  for (int64_t i = 0; i < count || count == -1; i++) {
    _update(looper, string("loop" + std::to_string(i)), false);
  }
}

ACTION testwax::useram(name caller, uint64_t count) {
  ramblast_table _ramblast(get_self(), caller.value);
  for(uint64_t i = 0; i < count; i++) {
    _ramblast.emplace(caller, [&](auto& row) {
      row.id = _ramblast.available_primary_key();;
      row.message = "uuuuuuuuuuuuuuuuussssssssssssssseeeeeeeeeeeeeeeee uuuuuuuuuuuuuuppppppppppppppppppp rrrrrrrrrrrrrrrrraaaaaaaaaaaaaaaaaaaaaaammmmmmmmmmmmmm";
    });
  }
}

ACTION testwax::releaseram(name caller, uint64_t count) {
  ramblast_table _ramblast(get_self(), caller.value);
  for (uint64_t i = 0; i < count; i++) {
    auto itr = _ramblast.begin();
    if(itr == _ramblast.end()) {
      break;
    }
    _ramblast.erase(itr);
  }
}

EOSIO_DISPATCH(testwax, (update) (loop) (log) (calllog) (useram) (releaseram));
