#include <eosio/eosio.hpp>

using namespace std;
using namespace eosio;

CONTRACT testwax : public contract {
  public:
    using contract::contract;

    ACTION update(name updater, string message, bool fail);
    ACTION calllog(name logger, string message);
    ACTION log(string message) {}
    ACTION loop(name looper, int64_t count);
    ACTION useram(name caller, uint64_t count);
    ACTION releaseram(name caller, uint64_t count);

  private:
    void _update(name updater, string message, bool fail);

    TABLE messages {
      name    updater;
      string  message;
      auto primary_key() const { return updater.value; }
    };
    typedef multi_index<name("messages"), messages> messages_table;

    TABLE ramblast {
      uint64_t id;
      string  message;
      auto primary_key() const { return id; }
    };
    typedef multi_index<name("ramblast"), ramblast> ramblast_table;
};
